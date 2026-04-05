import mongoose from 'mongoose';

const stockTransferSchema = new mongoose.Schema({
  // Source
  sourceProductId: {
    type: String,
    required: [true, 'Source product ID is required'],
    index: true
  },
  sourceLocation: {
    type: String,
    default: 'Main Warehouse'
  },
  
  // Destination
  destinationLocation: {
    type: String,
    required: [true, 'Destination location is required']
  },
  
  // Transfer details
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  reason: {
    type: String,
    enum: ['Restock', 'Fulfillment', 'Consolidation', 'Damage Prevention', 'Other'],
    default: 'Restock'
  },
  notes: { type: String, trim: true },
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELED'],
    default: 'PENDING'
  },
  
  // Tracking
  initiatedBy: { type: String },
  initiatedByName: { type: String },
  receivedBy: { type: String },
  receivedByName: { type: String },
  receivedAt: { type: Date },
  
  // Metadata
  productName: { type: String },
  sku: { type: String },
  expectedDelivery: { type: Date },
  
}, {
  timestamps: true,
  collection: 'stock_transfers'
});

const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
export default StockTransfer;
