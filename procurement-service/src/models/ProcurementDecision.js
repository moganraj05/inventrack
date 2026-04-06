import mongoose from 'mongoose';

const procurementDecisionSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    productName: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['recommended', 'approved', 'ordered', 'deferred', 'rejected'],
      default: 'recommended'
    },
    selectedSupplierId: {
      type: String,
      default: ''
    },
    selectedSupplierName: {
      type: String,
      default: ''
    },
    suggestedQuantity: {
      type: Number,
      default: 0
    },
    finalQuantity: {
      type: Number,
      default: 0
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium'
    },
    expectedStockoutDays: {
      type: Number,
      default: 0
    },
    rationale: {
      type: [String],
      default: []
    },
    managerNote: {
      type: String,
      default: ''
    },
    lastEvaluatedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: String,
      default: ''
    },
    updatedBy: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'procurement_decisions'
  }
);

const ProcurementDecision =
  mongoose.models.ProcurementDecision || mongoose.model('ProcurementDecision', procurementDecisionSchema);

export default ProcurementDecision;
