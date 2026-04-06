import express from 'express';
import { body } from 'express-validator';
import {
  getProcurementSummary,
  getRecommendations,
  getDecisions,
  updateRecommendationDecision
} from '../controllers/procurementController.js';

const router = express.Router();

router.get('/dashboard/summary', getProcurementSummary);
router.get('/recommendations', getRecommendations);
router.get('/decisions', getDecisions);
router.put(
  '/recommendations/:productId/decision',
  [
    body('status')
      .isIn(['approved', 'ordered', 'deferred', 'rejected'])
      .withMessage('Status must be approved, ordered, deferred, or rejected'),
    body('finalQuantity')
      .optional({ values: 'falsy' })
      .isFloat({ min: 0 })
      .withMessage('Final quantity must be zero or greater')
  ],
  updateRecommendationDecision
);

export default router;
