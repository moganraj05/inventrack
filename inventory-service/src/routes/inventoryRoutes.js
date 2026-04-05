import express from 'express';
import { body } from 'express-validator';
import {
  getAllStock, getStockByProduct, initializeStock, adjustStock,
  updateStockSettings, getLowStockAlerts, getTransactions, getInventorySummary
} from '../controllers/inventoryController.js';

const router = express.Router();

// Stock routes
router.get('/', getAllStock);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/dashboard/summary', getInventorySummary);
router.get('/:productId', getStockByProduct);
router.post('/', [
  body('productId').notEmpty().withMessage('Product ID required'),
  body('productName').notEmpty().withMessage('Product name required'),
  body('sku').notEmpty().withMessage('SKU required')
], initializeStock);
router.post('/:productId/adjust', [
  body('type').isIn(['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED']).withMessage('Invalid type'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive')
], adjustStock);
router.put('/:productId', updateStockSettings);

export default router;
