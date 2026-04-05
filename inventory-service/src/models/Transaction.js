import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  productId: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED']
  },
  quantity: { type: Number, required: true },
  quantityBefore: { type: Number, required: true },
  quantityAfter: { type: Number, required: true },
  reason: { type: String, trim: true },
  reference: { type: String, trim: true },
  performedBy: { type: String },
  performedByName: { type: String },
  notes: { type: String }
}, {
  timestamps: true,
  collection: 'transactions'
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
