import express from 'express';
import { body } from 'express-validator';
import {
  getAllSuppliers, getSupplierById, createSupplier,
  updateSupplier, deleteSupplier, getSupplierStats
} from '../controllers/supplierController.js';

const router = express.Router();

const supplierValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().trim()
];

router.get('/', getAllSuppliers);
router.get('/stats/summary', getSupplierStats);
router.get('/:id', getSupplierById);
router.post('/', supplierValidation, createSupplier);
router.put('/:id', supplierValidation, updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
