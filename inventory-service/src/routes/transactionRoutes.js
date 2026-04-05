import express from 'express';
import { getTransactions } from '../controllers/inventoryController.js';

const router = express.Router();
router.get('/', getTransactions);
export default router;
