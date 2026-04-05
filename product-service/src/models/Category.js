import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, collection: 'categories' });

const Category = mongoose.model('Category', categorySchema);
export default Category;
