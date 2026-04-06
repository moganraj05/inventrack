import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: Object,
    contactPerson: String,
    website: String,
    category: String,
    paymentTerms: String,
    rating: Number,
    notes: String,
    isActive: Boolean,
    createdBy: String
  },
  {
    timestamps: true,
    collection: 'suppliers'
  }
);

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
export default Supplier;
