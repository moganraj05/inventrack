import express from 'express';
import { body } from 'express-validator';
import {
  initiateTransfer,
  getTransfers,
  receiveTransfer,
  cancelTransfer
} from '../controllers/inventoryController.js';

const router = express.Router();

const transferValidation = [
  body('sourceProductId').notEmpty().withMessage('Source product ID is required'),
  body('destinationLocation').notEmpty().withMessage('Destination location is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// Stock Transfer routes
router.post('/initiate', transferValidation, initiateTransfer);
router.get('/', getTransfers);
router.put('/:transferId/received', receiveTransfer);
router.delete('/:transferId', cancelTransfer);

export default router;
