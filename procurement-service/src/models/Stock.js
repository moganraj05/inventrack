import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema(
  {
    productId: String,
    productName: String,
    sku: String,
    quantity: Number,
    reserved: Number,
    lowStockThreshold: Number,
    location: String,
    unit: String,
    lastUpdated: Date,
    lastUpdatedBy: String
  },
  {
    timestamps: true,
    collection: 'stock'
  }
);

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);
export default Stock;
