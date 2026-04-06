import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    isActive: Boolean
  },
  {
    collection: 'categories'
  }
);

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export default Category;
