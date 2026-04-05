import express from 'express';
import { body } from 'express-validator';
import {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getAllCategories, createCategory, updateCategory, deleteCategory
} from '../controllers/productController.js';

const router = express.Router();

const productValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required')
];

// Products
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', productValidation, createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
