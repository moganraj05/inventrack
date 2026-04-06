import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    productId: String,
    productName: String,
    sku: String,
    type: String,
    quantity: Number,
    quantityBefore: Number,
    quantityAfter: Number,
    reason: String,
    reference: String,
    performedBy: String,
    performedByName: String,
    notes: String
  },
  {
    timestamps: true,
    collection: 'transactions'
  }
);

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export default Transaction;
