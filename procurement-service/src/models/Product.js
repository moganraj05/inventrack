import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: String,
    sku: String,
    description: String,
    category: mongoose.Schema.Types.ObjectId,
    price: Number,
    costPrice: Number,
    unit: String,
    lowStockThreshold: Number,
    imageUrl: String,
    supplier: String,
    isActive: Boolean,
    tags: [String]
  },
  {
    timestamps: true,
    collection: 'products'
  }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
