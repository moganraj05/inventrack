import { validationResult } from 'express-validator';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Stock from '../models/Stock.js';
import Supplier from '../models/Supplier.js';
import Transaction from '../models/Transaction.js';
import ProcurementDecision from '../models/ProcurementDecision.js';
import { getCache, invalidatePattern, setCache } from '../config/cache.js';

const PROCUREMENT_ROLES = ['manager', 'admin'];
const RECOMMENDATION_WINDOW_DAYS = 30;

const paymentTermWeight = {
  Immediate: 10,
  'Net 15': 9,
  'Net 30': 8,
  'Net 45': 6,
  'Net 60': 4,
  Custom: 5
};

const requireProcurementAccess = (req, res) => {
  const role = req.headers['x-user-role'];
  if (!PROCUREMENT_ROLES.includes(role)) {
    res.status(403).json({ error: 'Manager or admin access required' });
    return false;
  }
  return true;
};

const round = (value, precision = 1) => {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const buildPriority = ({ available, lowStockThreshold, stockoutDays, dailyUsage }) => {
  if (available <= 0 || stockoutDays <= 3) return 'critical';
  if (available <= lowStockThreshold || stockoutDays <= 10) return 'high';
  if (dailyUsage > 0.75 || stockoutDays <= 21) return 'medium';
  return 'low';
};

const buildReasons = ({
  available,
  lowStockThreshold,
  stockoutDays,
  dailyUsage,
  suggestedSupplier,
  candidateSuppliers
}) => {
  const reasons = [];

  if (available <= lowStockThreshold) {
    reasons.push(`Available stock (${available}) is at or below the low-stock threshold (${lowStockThreshold}).`);
  } else {
    reasons.push(`Available stock is ${available}, which leaves only ${round(stockoutDays, 0)} days of cover.`);
  }

  reasons.push(`Estimated daily usage is ${round(dailyUsage, 1)} units based on recent activity and fallback demand heuristics.`);

  if (suggestedSupplier) {
    reasons.push(
      `${suggestedSupplier.name} is the best supplier fit with a score of ${round(suggestedSupplier.score, 0)} and an estimated ${suggestedSupplier.estimatedLeadTimeDays}-day lead time.`
    );
  }

  if (candidateSuppliers.length > 1) {
    reasons.push(`Compared ${candidateSuppliers.length} supplier options for category match, rating, and payment terms.`);
  }

  return reasons;
};

const computeSupplierOptions = ({ product, productCategory, suppliers, stockLocation, recommendedQty }) => {
  const normalizedCategory = (productCategory || '').toLowerCase();
  const normalizedPrimarySupplier = (product.supplier || '').trim().toLowerCase();
  const locationHint = (stockLocation || '').toLowerCase();

  const options = suppliers
    .filter((supplier) => supplier.isActive !== false)
    .map((supplier) => {
      const exactMatch = supplier.name?.trim().toLowerCase() === normalizedPrimarySupplier;
      const categoryMatch = (supplier.category || '').toLowerCase() === normalizedCategory;
      const sameRegion =
        locationHint &&
        [supplier.address?.city, supplier.address?.state]
          .filter(Boolean)
          .some((value) => locationHint.includes(String(value).toLowerCase()));
      const rating = Number(supplier.rating || 0);
      const leadBase = Math.max(2, 9 - rating - (exactMatch ? 2 : 0) - (sameRegion ? 1 : 0));
      const score =
        (exactMatch ? 42 : 0) +
        (categoryMatch ? 24 : 0) +
        (sameRegion ? 10 : 0) +
        rating * 8 +
        (paymentTermWeight[supplier.paymentTerms] || 5);

      return {
        supplierId: supplier._id.toString(),
        name: supplier.name,
        category: supplier.category || 'General',
        rating,
        paymentTerms: supplier.paymentTerms || 'Net 30',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        estimatedLeadTimeDays: leadBase,
        score,
        projectedSpend: Math.round((recommendedQty || 0) * Number(product.costPrice || 0)),
        exactMatch,
        categoryMatch
      };
    })
    .filter((option) => option.exactMatch || option.categoryMatch)
    .sort((a, b) => b.score - a.score || a.estimatedLeadTimeDays - b.estimatedLeadTimeDays);

  return options.slice(0, 3);
};

const buildProcurementDataset = async () => {
  const cacheKey = 'procurement_dataset_v1';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const windowStart = new Date(Date.now() - RECOMMENDATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [products, categories, stocks, suppliers, decisions, usageRows] = await Promise.all([
    Product.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).lean(),
    Category.find({ isActive: { $ne: false } }).lean(),
    Stock.find().lean(),
    Supplier.find({ isActive: { $ne: false } }).lean(),
    ProcurementDecision.find().lean(),
    Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: windowStart },
          type: { $in: ['OUT', 'DAMAGED', 'RETURN'] }
        }
      },
      {
        $group: {
          _id: '$productId',
          outgoingQty: {
            $sum: {
              $cond: [{ $in: ['$type', ['OUT', 'DAMAGED']] }, '$quantity', 0]
            }
          },
          returnQty: {
            $sum: {
              $cond: [{ $eq: ['$type', 'RETURN'] }, '$quantity', 0]
            }
          },
          lastMovementAt: { $max: '$createdAt' }
        }
      }
    ])
  ]);

  const categoryById = new Map(categories.map((category) => [category._id.toString(), category.name]));
  const stockByProductId = new Map(stocks.map((stock) => [String(stock.productId), stock]));
  const decisionByProductId = new Map(decisions.map((decision) => [String(decision.productId), decision]));
  const usageByProductId = new Map(
    usageRows.map((row) => [
      String(row._id),
      {
        consumed: Math.max(0, Number(row.outgoingQty || 0) - Number(row.returnQty || 0)),
        lastMovementAt: row.lastMovementAt || null
      }
    ])
  );

  const recommendations = products
    .map((product) => {
      const productId = product._id.toString();
      const stock = stockByProductId.get(productId);
      if (!stock) return null;

      const categoryName = categoryById.get(String(product.category)) || 'General';
      const usage = usageByProductId.get(productId);
      const available = Math.max(0, Number(stock.quantity || 0) - Number(stock.reserved || 0));
      const lowStockThreshold = Math.max(1, Number(product.lowStockThreshold || stock.lowStockThreshold || 10));
      const baselineDailyUsage = Math.max(lowStockThreshold / 12, 0.4);
      const observedDailyUsage = usage ? Number(usage.consumed || 0) / RECOMMENDATION_WINDOW_DAYS : 0;
      const dailyUsage = observedDailyUsage > 0 ? observedDailyUsage : baselineDailyUsage;
      const stockoutDays = dailyUsage > 0 ? available / dailyUsage : 999;
      const targetStock = Math.max(lowStockThreshold * 3, dailyUsage * 28);
      const reorderPoint = Math.max(lowStockThreshold * 1.25, dailyUsage * 10);
      const recommendedQty = Math.max(0, Math.ceil(targetStock - available));
      const supplierOptions = computeSupplierOptions({
        product,
        productCategory: categoryName,
        suppliers,
        stockLocation: stock.location,
        recommendedQty
      });
      const suggestedSupplier = supplierOptions[0] || null;
      const priority = buildPriority({ available, lowStockThreshold, stockoutDays, dailyUsage });
      const riskScore = Math.min(
        100,
        Math.max(
          5,
          Math.round(
            (available <= lowStockThreshold ? 40 : 10) +
              Math.max(0, 30 - Math.min(stockoutDays, 30)) +
              (priority === 'critical' ? 25 : priority === 'high' ? 15 : priority === 'medium' ? 8 : 0)
          )
        )
      );
      const projectedStockValue = Math.round(available * Number(product.costPrice || 0));
      const decision = decisionByProductId.get(productId) || null;

      return {
        productId,
        name: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl || '',
        category: categoryName,
        unit: product.unit || stock.unit || 'piece',
        supplier: product.supplier || '',
        stockLocation: stock.location || 'Main Warehouse',
        available,
        quantity: Number(stock.quantity || 0),
        reserved: Number(stock.reserved || 0),
        lowStockThreshold,
        dailyUsage: round(dailyUsage, 1),
        stockoutDays: stockoutDays === 999 ? null : round(stockoutDays, 1),
        reorderPoint: round(reorderPoint, 1),
        recommendedQty,
        costPrice: Number(product.costPrice || 0),
        projectedSpend: Math.round(recommendedQty * Number(product.costPrice || 0)),
        projectedStockValue,
        expectedMargin: Math.round(recommendedQty * Math.max(0, Number(product.price || 0) - Number(product.costPrice || 0))),
        priority,
        riskScore,
        suggestedSupplier,
        supplierOptions,
        lastMovementAt: usage?.lastMovementAt || null,
        decision,
        recommendationStatus: decision?.status || 'recommended',
        reasons: buildReasons({
          available,
          lowStockThreshold,
          stockoutDays: stockoutDays === 999 ? 60 : stockoutDays,
          dailyUsage,
          suggestedSupplier,
          candidateSuppliers: supplierOptions
        })
      };
    })
    .filter(Boolean);

  const summary = {
    totalRecommendations: recommendations.length,
    criticalCount: recommendations.filter((item) => item.priority === 'critical').length,
    highPriorityCount: recommendations.filter((item) => item.priority === 'high').length,
    approvedCount: recommendations.filter((item) => item.recommendationStatus === 'approved').length,
    orderedCount: recommendations.filter((item) => item.recommendationStatus === 'ordered').length,
    pendingCount: recommendations.filter((item) => item.recommendationStatus === 'recommended').length,
    deferredCount: recommendations.filter((item) => item.recommendationStatus === 'deferred').length,
    rejectedCount: recommendations.filter((item) => item.recommendationStatus === 'rejected').length,
    projectedSpend: recommendations.reduce((sum, item) => sum + item.projectedSpend, 0),
    atRiskStockValue: recommendations
      .filter((item) => ['critical', 'high'].includes(item.priority))
      .reduce((sum, item) => sum + item.projectedStockValue, 0),
    topSuppliers: suppliers
      .filter((supplier) => supplier.isActive !== false)
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 5)
      .map((supplier) => ({
        id: supplier._id.toString(),
        name: supplier.name,
        rating: Number(supplier.rating || 0),
        category: supplier.category || 'General',
        paymentTerms: supplier.paymentTerms || 'Net 30'
      }))
  };

  const result = { recommendations, summary };
  setCache(cacheKey, result, 120);
  return result;
};

export const getProcurementSummary = async (req, res) => {
  if (!requireProcurementAccess(req, res)) return;

  try {
    const { summary } = await buildProcurementDataset();
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch procurement summary', details: err.message });
  }
};

export const getRecommendations = async (req, res) => {
  if (!requireProcurementAccess(req, res)) return;

  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      priority = '',
      status = '',
      supplier = '',
      category = ''
    } = req.query;

    const { recommendations, summary } = await buildProcurementDataset();
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = recommendations.filter((item) => {
      if (normalizedSearch) {
        const haystack = [item.name, item.sku, item.category, item.supplier, item.suggestedSupplier?.name || '']
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      if (priority && item.priority !== priority) return false;
      if (status && item.recommendationStatus !== status) return false;
      if (supplier) {
        const supplierName = (item.suggestedSupplier?.name || item.supplier || '').toLowerCase();
        if (!supplierName.includes(String(supplier).toLowerCase())) return false;
      }
      if (category && item.category !== category) return false;
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return (
        priorityWeight[b.priority] - priorityWeight[a.priority] ||
        (a.stockoutDays ?? 999) - (b.stockoutDays ?? 999) ||
        b.riskScore - a.riskScore
      );
    });

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paged = sorted.slice(skip, skip + parseInt(limit, 10));

    res.json({
      success: true,
      recommendations: paged,
      filters: {
        categories: [...new Set(recommendations.map((item) => item.category))].sort((a, b) => a.localeCompare(b)),
        statuses: ['recommended', 'approved', 'ordered', 'deferred', 'rejected'],
        priorities: ['critical', 'high', 'medium', 'low']
      },
      summary,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: sorted.length,
        pages: Math.max(1, Math.ceil(sorted.length / parseInt(limit, 10)))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations', details: err.message });
  }
};

export const getDecisions = async (req, res) => {
  if (!requireProcurementAccess(req, res)) return;

  try {
    const decisions = await ProcurementDecision.find().sort({ updatedAt: -1 });
    res.json({ success: true, count: decisions.length, decisions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch procurement decisions', details: err.message });
  }
};

export const updateRecommendationDecision = async (req, res) => {
  if (!requireProcurementAccess(req, res)) return;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { recommendations } = await buildProcurementDataset();
    const recommendation = recommendations.find((item) => item.productId === req.params.productId);

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found for this product' });
    }

    const {
      status,
      finalQuantity,
      selectedSupplierId = '',
      selectedSupplierName = '',
      managerNote = ''
    } = req.body;

    const userId = req.headers['x-user-id'] || '';

    const decision = await ProcurementDecision.findOneAndUpdate(
      { productId: recommendation.productId },
      {
        $set: {
          productName: recommendation.name,
          sku: recommendation.sku,
          status,
          selectedSupplierId: selectedSupplierId || recommendation.suggestedSupplier?.supplierId || '',
          selectedSupplierName: selectedSupplierName || recommendation.suggestedSupplier?.name || recommendation.supplier || '',
          suggestedQuantity: recommendation.recommendedQty,
          finalQuantity:
            finalQuantity === undefined || finalQuantity === null || finalQuantity === ''
              ? recommendation.recommendedQty
              : Number(finalQuantity),
          priority: recommendation.priority,
          expectedStockoutDays: recommendation.stockoutDays || 0,
          rationale: recommendation.reasons,
          managerNote,
          lastEvaluatedAt: new Date(),
          updatedBy: userId
        },
        $setOnInsert: {
          createdBy: userId
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    invalidatePattern('procurement_dataset_v1');

    res.json({
      success: true,
      message: 'Procurement decision updated',
      decision
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update procurement decision', details: err.message });
  }
};
