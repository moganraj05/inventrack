import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    unique: true,
    index: true
  },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  reserved: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  location: { type: String, default: 'Main Warehouse' },
  unit: { type: String, default: 'piece' },
  lastUpdated: { type: Date, default: Date.now },
  lastUpdatedBy: { type: String }
}, {
  timestamps: true,
  collection: 'stock'
});

stockSchema.virtual('available').get(function () {
  return Math.max(0, this.quantity - this.reserved);
});

stockSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.lowStockThreshold;
});

stockSchema.set('toJSON', { virtuals: true });

const Stock = mongoose.model('Stock', stockSchema);
export default Stock;
