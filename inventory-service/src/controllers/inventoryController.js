import { validationResult } from 'express-validator';
import Stock from '../models/Stock.js';
import Transaction from '../models/Transaction.js';
import { getCache, setCache, invalidatePattern } from '../config/cache.js';

// GET /api/inventory - all stock items
export const getAllStock = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, lowStock } = req.query;
    const cacheKey = `stock_all_${JSON.stringify(req.query)}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const query = {};
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [stocks, total] = await Promise.all([
      Stock.find(query).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Stock.countDocuments(query)
    ]);

    const result = {
      success: true,
      stocks,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock', details: err.message });
  }
};

// GET /api/inventory/:productId
export const getStockByProduct = async (req, res) => {
  try {
    const cacheKey = `stock_${req.params.productId}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const stock = await Stock.findOne({ productId: req.params.productId });
    if (!stock) return res.status(404).json({ error: 'Stock record not found' });

    const result = { success: true, stock };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock', details: err.message });
  }
};

// POST /api/inventory - initialize stock for a product
export const initializeStock = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { productId, productName, sku, quantity = 0, lowStockThreshold = 10, location, unit } = req.body;
    const userId = req.headers['x-user-id'];

    const existing = await Stock.findOne({ productId });
    if (existing) return res.status(409).json({ error: 'Stock already initialized for this product' });

    const stock = await Stock.create({ productId, productName, sku, quantity, lowStockThreshold, location, unit, lastUpdatedBy: userId });

    if (quantity > 0) {
      await Transaction.create({
        productId, productName, sku,
        type: 'IN', quantity,
        quantityBefore: 0, quantityAfter: quantity,
        reason: 'Initial stock setup',
        performedBy: userId
      });
    }

    invalidatePattern('stock_all');
    res.status(201).json({ success: true, message: 'Stock initialized', stock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initialize stock', details: err.message });
  }
};

// POST /api/inventory/:productId/adjust - add/remove stock
export const adjustStock = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { type, quantity, reason, reference, notes } = req.body;
    const userId = req.headers['x-user-id'];
    const { productId } = req.params;

    const stock = await Stock.findOne({ productId });
    if (!stock) return res.status(404).json({ error: 'Stock record not found' });

    const quantityBefore = stock.quantity;
    let quantityAfter;

    switch (type) {
      case 'IN':
      case 'RETURN':
        quantityAfter = quantityBefore + quantity;
        break;
      case 'OUT':
      case 'DAMAGED':
        if (quantity > stock.available) {
          return res.status(400).json({ error: `Insufficient stock. Available: ${stock.available}` });
        }
        quantityAfter = quantityBefore - quantity;
        break;
      case 'ADJUSTMENT':
        if (quantity < 0) return res.status(400).json({ error: 'Adjustment quantity cannot be negative. Use the OUT type for reductions.' });
        quantityAfter = quantity;
        break;
      default:
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    stock.quantity = quantityAfter;
    stock.lastUpdated = new Date();
    stock.lastUpdatedBy = userId;
    await stock.save();

    await Transaction.create({
      productId, productName: stock.productName, sku: stock.sku,
      type, quantity, quantityBefore, quantityAfter,
      reason, reference, notes, performedBy: userId
    });

    invalidatePattern('stock_all');
    invalidatePattern(`stock_${productId}`);

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      stock,
      isLowStock: stock.quantity <= stock.lowStockThreshold
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjust stock', details: err.message });
  }
};

// PUT /api/inventory/:productId - update stock settings
export const updateStockSettings = async (req, res) => {
  try {
    const { lowStockThreshold, location, unit } = req.body;
    const stock = await Stock.findOneAndUpdate(
      { productId: req.params.productId },
      { lowStockThreshold, location, unit },
      { new: true }
    );
    if (!stock) return res.status(404).json({ error: 'Stock record not found' });

    invalidatePattern('stock_all');
    invalidatePattern(`stock_${req.params.productId}`);
    res.json({ success: true, message: 'Stock settings updated', stock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock settings', details: err.message });
  }
};

// GET /api/inventory/alerts/low-stock
export const getLowStockAlerts = async (req, res) => {
  try {
    const cacheKey = 'low_stock_alerts';
    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const alerts = await Stock.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }).sort({ quantity: 1 });
    const result = { success: true, count: alerts.length, alerts };
    setCache(cacheKey, result, 60);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low stock alerts', details: err.message });
  }
};

// GET /api/transactions
export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, type } = req.query;
    const query = {};
    if (productId) query.productId = productId;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      transactions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
  }
};

// GET /api/inventory/dashboard/summary
export const getInventorySummary = async (req, res) => {
  try {
    const cacheKey = 'inventory_summary';
    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const [totalProducts, lowStockCount, totalTransactions, recentTransactions] = await Promise.all([
      Stock.countDocuments(),
      Stock.countDocuments({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } }),
      Transaction.countDocuments(),
      Transaction.find().sort({ createdAt: -1 }).limit(5)
    ]);

    const stockAggregate = await Stock.aggregate([
      { $group: { _id: null, totalQuantity: { $sum: '$quantity' }, outOfStock: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } } } }
    ]);

    const result = {
      success: true,
      summary: {
        totalProducts,
        lowStockCount,
        totalTransactions,
        totalQuantity: stockAggregate[0]?.totalQuantity || 0,
        outOfStock: stockAggregate[0]?.outOfStock || 0,
        recentTransactions
      }
    };

    setCache(cacheKey, result, 60);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary', details: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK TRANSFER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/inventory/transfer/initiate - Create a stock transfer
export const initiateTransfer = async (req, res) => {
  try {
    const StockTransfer = require('../models/StockTransfer.js').default;
    const { sourceProductId, destinationLocation, quantity, reason, notes } = req.body;
    const userId = req.headers['x-user-id'];

    // Validate source stock
    const sourceStock = await Stock.findOne({ productId: sourceProductId });
    if (!sourceStock) return res.status(404).json({ error: 'Source stock not found' });
    if (sourceStock.quantity < quantity) {
      return res.status(400).json({ error: `Insufficient quantity. Available: ${sourceStock.quantity}` });
    }

    // Create transfer record
    const transfer = await StockTransfer.create({
      sourceProductId,
      sourceLocation: sourceStock.location,
      destinationLocation,
      quantity,
      reason,
      notes,
      productName: sourceStock.productName,
      sku: sourceStock.sku,
      initiatedBy: userId,
      status: 'PENDING'
    });

    res.status(201).json({ success: true, message: 'Transfer initiated', transfer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate transfer', details: err.message });
  }
};

// GET /api/inventory/transfer - Get all stock transfers
export const getTransfers = async (req, res) => {
  try {
    const StockTransfer = require('../models/StockTransfer.js').default;
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transfers, total] = await Promise.all([
      StockTransfer.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      StockTransfer.countDocuments(query)
    ]);

    res.json({
      success: true,
      transfers,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transfers', details: err.message });
  }
};

// PUT /api/inventory/transfer/:transferId/received - Mark transfer as received
export const receiveTransfer = async (req, res) => {
  try {
    const StockTransfer = require('../models/StockTransfer.js').default;
    const userId = req.headers['x-user-id'];
    const { transferId } = req.params;

    // Find transfer
    const transfer = await StockTransfer.findById(transferId);
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    if (transfer.status === 'RECEIVED') return res.status(400).json({ error: 'Transfer already received' });

    // Update source stock location (if needed)
    const sourceStock = await Stock.findOne({ productId: transfer.sourceProductId });
    if (sourceStock) {
      sourceStock.location = transfer.destinationLocation;
      sourceStock.lastUpdatedBy = userId;
      sourceStock.lastUpdated = new Date();
      await sourceStock.save();
    }

    // Update transfer
    transfer.status = 'RECEIVED';
    transfer.receivedBy = userId;
    transfer.receivedAt = new Date();
    await transfer.save();

    // Create ADJUSTMENT transaction to reflect location change
    if (sourceStock) {
      await Transaction.create({
        productId: transfer.sourceProductId,
        productName: sourceStock.productName,
        sku: sourceStock.sku,
        type: 'ADJUSTMENT',
        quantity: sourceStock.quantity,
        quantityBefore: sourceStock.quantity,
        quantityAfter: sourceStock.quantity,
        reason: `Transfer received: ${transfer.sourceLocation} → ${transfer.destinationLocation}`,
        reference: trasnderId,
        performedBy: userId,
        notes: transfer.notes
      });
    }

    invalidatePattern('stock_all');
    res.json({ success: true, message: 'Transfer received', transfer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to receive transfer', details: err.message });
  }
};

// DELETE /api/inventory/transfer/:transferId - Cancel a transfer
export const cancelTransfer = async (req, res) => {
  try {
    const StockTransfer = require('../models/StockTransfer.js').default;
    const { transferId } = req.params;

    const transfer = await StockTransfer.findById(transferId);
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    if (transfer.status === 'RECEIVED') return res.status(400).json({ error: 'Cannot cancel received transfer' });

    transfer.status = 'CANCELED';
    await transfer.save();

    res.json({ success: true, message: 'Transfer canceled', transfer });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel transfer', details: err.message });
  }
};
