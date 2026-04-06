import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://moganraj:mernmogan@mernapp.0kzohrt.mongodb.net/inventrack?appName=mernapp';

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'staff' },
    isActive: { type: Boolean, default: true }
  },
  { collection: 'users' }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    description: String,
    isActive: { type: Boolean, default: true }
  },
  { collection: 'categories' }
);

const productSchema = new mongoose.Schema(
  {
    name: String,
    sku: { type: String, unique: true },
    description: String,
    category: mongoose.Schema.Types.ObjectId,
    price: Number,
    costPrice: Number,
    unit: String,
    lowStockThreshold: Number,
    imageUrl: String,
    supplier: String,
    isActive: { type: Boolean, default: true },
    tags: [String]
  },
  { collection: 'products' }
);

const stockSchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true },
    productName: String,
    sku: String,
    quantity: Number,
    reserved: { type: Number, default: 0 },
    lowStockThreshold: Number,
    location: String,
    unit: String,
    lastUpdated: Date
  },
  { collection: 'stock' }
);

const transactionSchema = new mongoose.Schema(
  {
    productId: String,
    productName: String,
    sku: String,
    type: String,
    quantity: Number,
    quantityBefore: Number,
    quantityAfter: Number,
    reason: String
  },
  { collection: 'transactions', timestamps: true }
);

const supplierSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    contactPerson: String,
    category: String,
    paymentTerms: String,
    rating: Number,
    address: Object,
    isActive: { type: Boolean, default: true }
  },
  { collection: 'suppliers' }
);

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Stock = mongoose.model('Stock', stockSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);

const categoryDefinitions = [
  { name: 'Electronics', description: 'Devices, accessories, and retail tech hardware' },
  { name: 'Furniture', description: 'Office, store, and workspace furniture' },
  { name: 'Stationery', description: 'Paper goods, labeling, and desk supplies' },
  { name: 'Apparel', description: 'Uniforms, protective wear, and textile accessories' },
  { name: 'Raw Materials', description: 'Packaging and production input materials' },
  { name: 'Groceries', description: 'Indian staple foods, grains, oils, and beverages' },
  { name: 'Home & Personal Care', description: 'Cleaning, hygiene, and everyday care items' }
];

const supplierDefinitions = [
  {
    name: 'Bharat Tech Distributors',
    email: 'sales@bharattech.in',
    phone: '+91 98450 11001',
    contactPerson: 'Rohit Verma',
    category: 'Electronics',
    paymentTerms: 'Net 30',
    rating: 5,
    address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' }
  },
  {
    name: 'Metro Workspace Furnishings',
    email: 'orders@metroworkspace.in',
    phone: '+91 98201 22002',
    contactPerson: 'Sneha Kulkarni',
    category: 'Furniture',
    paymentTerms: 'Net 45',
    rating: 4,
    address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }
  },
  {
    name: 'PaperGrid Office Supply Co.',
    email: 'support@papergrid.in',
    phone: '+91 97909 33003',
    contactPerson: 'Karthik Raman',
    category: 'Stationery',
    paymentTerms: 'Net 15',
    rating: 4,
    address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' }
  },
  {
    name: 'Shakti Uniforms Private Limited',
    email: 'sales@shaktiuniforms.in',
    phone: '+91 98111 44004',
    contactPerson: 'Pooja Singh',
    category: 'Apparel',
    paymentTerms: 'Net 30',
    rating: 4,
    address: { city: 'Noida', state: 'Uttar Pradesh', country: 'India' }
  },
  {
    name: 'Prime Pack Materials',
    email: 'contact@primepack.in',
    phone: '+91 98862 55005',
    contactPerson: 'Harish Gowda',
    category: 'Raw Materials',
    paymentTerms: 'Net 21',
    rating: 4,
    address: { city: 'Pune', state: 'Maharashtra', country: 'India' }
  },
  {
    name: 'Annapurna Wholesale Traders',
    email: 'bulk@annapurnafoods.in',
    phone: '+91 98948 66006',
    contactPerson: 'Lakshmi Narayanan',
    category: 'Groceries',
    paymentTerms: 'Immediate',
    rating: 5,
    address: { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' }
  },
  {
    name: 'CleanCart Essentials',
    email: 'care@cleancart.in',
    phone: '+91 98730 77007',
    contactPerson: 'Ayesha Khan',
    category: 'Home & Personal Care',
    paymentTerms: 'Net 20',
    rating: 4,
    address: { city: 'Hyderabad', state: 'Telangana', country: 'India' }
  }
];

const makeImageDataUrl = (label, accent) => {
  const safeLabel = label.replace(/[<&>]/g, '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#bg)" rx="28" />
      <circle cx="520" cy="90" r="68" fill="rgba(255,255,255,0.12)" />
      <circle cx="102" cy="386" r="112" fill="rgba(255,255,255,0.08)" />
      <text x="44" y="210" fill="#f8fafc" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="700">
        ${safeLabel}
      </text>
      <text x="44" y="265" fill="#dbeafe" font-family="Segoe UI, Arial, sans-serif" font-size="21">
        InvenTrack Seed Catalog
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const stockLocations = [
  'Warehouse A - Bengaluru',
  'Warehouse B - Chennai',
  'Warehouse C - Mumbai',
  'Retail Store - Hyderabad',
  'Retail Store - Kochi'
];

const buildQuantity = (product, index) => {
  if (index % 11 === 0) {
    return Math.max(product.lowStockThreshold - 2, 1);
  }

  switch (product.unit) {
    case 'kg':
      return 70 + (index % 6) * 18;
    case 'gram':
      return 180 + (index % 5) * 25;
    case 'liter':
      return 90 + (index % 5) * 16;
    case 'ml':
      return 140 + (index % 6) * 20;
    case 'meter':
      return 120 + (index % 5) * 24;
    case 'pack':
      return 55 + (index % 7) * 15;
    case 'box':
      return 35 + (index % 6) * 10;
    case 'dozen':
      return 16 + (index % 5) * 4;
    default:
      return 14 + (index % 8) * 6;
  }
};

const buildReserved = (quantity, index) => {
  if (quantity <= 5) return 0;
  return Math.min(Math.floor(quantity * 0.14), 12 + (index % 4));
};

const productCatalog = [
  {
    name: 'Wireless Barcode Scanner',
    sku: 'ELEC-IND-001',
    description: 'Rechargeable barcode scanner for billing counters and stock intake.',
    category: 'Electronics',
    price: 3499,
    costPrice: 2380,
    unit: 'piece',
    lowStockThreshold: 8,
    supplier: 'Bharat Tech Distributors',
    tags: ['scanner', 'retail', 'billing'],
    accent: '#2563eb'
  },
  {
    name: 'USB-C Fast Charger 30W',
    sku: 'ELEC-IND-002',
    description: 'Compact fast charger for phones, handheld terminals, and tablets.',
    category: 'Electronics',
    price: 899,
    costPrice: 560,
    unit: 'piece',
    lowStockThreshold: 20,
    supplier: 'Bharat Tech Distributors',
    tags: ['charger', 'usb-c', 'mobile'],
    accent: '#1d4ed8'
  },
  {
    name: '10,000mAh Power Bank',
    sku: 'ELEC-IND-003',
    description: 'Portable power bank for delivery staff and field sales teams.',
    category: 'Electronics',
    price: 1499,
    costPrice: 1040,
    unit: 'piece',
    lowStockThreshold: 12,
    supplier: 'Bharat Tech Distributors',
    tags: ['power', 'mobile', 'field-team'],
    accent: '#0f766e'
  },
  {
    name: 'Bluetooth Neckband Earphones',
    sku: 'ELEC-IND-004',
    description: 'Neckband earphones with long battery backup for call centers and teams.',
    category: 'Electronics',
    price: 1199,
    costPrice: 780,
    unit: 'piece',
    lowStockThreshold: 15,
    supplier: 'Bharat Tech Distributors',
    tags: ['audio', 'bluetooth', 'accessory'],
    accent: '#0891b2'
  },
  {
    name: 'LED Bulb 9W Pack',
    sku: 'ELEC-IND-005',
    description: 'Energy-saving LED bulb multipack for stores, offices, and warehouses.',
    category: 'Electronics',
    price: 399,
    costPrice: 250,
    unit: 'pack',
    lowStockThreshold: 24,
    supplier: 'Bharat Tech Distributors',
    tags: ['lighting', 'utility', 'store'],
    accent: '#f59e0b'
  },
  {
    name: 'POS Thermal Billing Printer',
    sku: 'ELEC-IND-006',
    description: 'High-speed receipt printer compatible with most POS setups.',
    category: 'Electronics',
    price: 6499,
    costPrice: 4550,
    unit: 'piece',
    lowStockThreshold: 6,
    supplier: 'Bharat Tech Distributors',
    tags: ['printer', 'pos', 'billing'],
    accent: '#7c3aed'
  },
  {
    name: '2MP CCTV Dome Camera',
    sku: 'ELEC-IND-007',
    description: 'Indoor dome camera for storerooms, counters, and entry surveillance.',
    category: 'Electronics',
    price: 1899,
    costPrice: 1320,
    unit: 'piece',
    lowStockThreshold: 10,
    supplier: 'Bharat Tech Distributors',
    tags: ['security', 'camera', 'surveillance'],
    accent: '#1e293b'
  },
  {
    name: 'Wi-Fi Router Dual Antenna',
    sku: 'ELEC-IND-008',
    description: 'Reliable router for office internet, billing desks, and handheld devices.',
    category: 'Electronics',
    price: 1599,
    costPrice: 1090,
    unit: 'piece',
    lowStockThreshold: 10,
    supplier: 'Bharat Tech Distributors',
    tags: ['network', 'router', 'office'],
    accent: '#0f766e'
  },
  {
    name: 'Mini Bluetooth Speaker',
    sku: 'ELEC-IND-009',
    description: 'Portable speaker for announcements, events, and compact demos.',
    category: 'Electronics',
    price: 1299,
    costPrice: 870,
    unit: 'piece',
    lowStockThreshold: 14,
    supplier: 'Bharat Tech Distributors',
    tags: ['speaker', 'portable', 'event'],
    accent: '#db2777'
  },
  {
    name: 'Smartwatch Fitness Edition',
    sku: 'ELEC-IND-010',
    description: 'Entry-level smartwatch stocked for gifting programs and staff rewards.',
    category: 'Electronics',
    price: 2299,
    costPrice: 1620,
    unit: 'piece',
    lowStockThreshold: 10,
    supplier: 'Bharat Tech Distributors',
    tags: ['watch', 'wearable', 'gift'],
    accent: '#334155'
  },
  {
    name: 'Mesh Office Chair',
    sku: 'FURN-IND-001',
    description: 'Ergonomic office chair with breathable back and lumbar support.',
    category: 'Furniture',
    price: 7999,
    costPrice: 5240,
    unit: 'piece',
    lowStockThreshold: 5,
    supplier: 'Metro Workspace Furnishings',
    tags: ['chair', 'office', 'ergonomic'],
    accent: '#475569'
  },
  {
    name: 'Engineered Wood Study Table',
    sku: 'FURN-IND-002',
    description: 'Simple workstation table suitable for counters and training rooms.',
    category: 'Furniture',
    price: 5999,
    costPrice: 4110,
    unit: 'piece',
    lowStockThreshold: 4,
    supplier: 'Metro Workspace Furnishings',
    tags: ['table', 'desk', 'workspace'],
    accent: '#92400e'
  },
  {
    name: 'Plastic Storage Rack 5 Shelf',
    sku: 'FURN-IND-003',
    description: 'Utility rack for keeping cartons, files, or bulk grocery stock.',
    category: 'Furniture',
    price: 2499,
    costPrice: 1740,
    unit: 'piece',
    lowStockThreshold: 7,
    supplier: 'Metro Workspace Furnishings',
    tags: ['rack', 'storage', 'warehouse'],
    accent: '#0369a1'
  },
  {
    name: 'Visitor Chair Cushioned',
    sku: 'FURN-IND-004',
    description: 'Powder-coated visitor chair for reception areas and waiting zones.',
    category: 'Furniture',
    price: 2199,
    costPrice: 1510,
    unit: 'piece',
    lowStockThreshold: 8,
    supplier: 'Metro Workspace Furnishings',
    tags: ['chair', 'reception', 'visitor'],
    accent: '#0f766e'
  },
  {
    name: 'Mobile Pedestal Drawer Unit',
    sku: 'FURN-IND-005',
    description: 'Rolling drawer cabinet for files, stationery, and point-of-sale tools.',
    category: 'Furniture',
    price: 3899,
    costPrice: 2660,
    unit: 'piece',
    lowStockThreshold: 6,
    supplier: 'Metro Workspace Furnishings',
    tags: ['drawer', 'storage', 'office'],
    accent: '#1d4ed8'
  },
  {
    name: 'Metal Filing Cabinet 4 Drawer',
    sku: 'FURN-IND-006',
    description: 'Lockable filing cabinet for invoices, records, and legal files.',
    category: 'Furniture',
    price: 9999,
    costPrice: 7020,
    unit: 'piece',
    lowStockThreshold: 3,
    supplier: 'Metro Workspace Furnishings',
    tags: ['cabinet', 'files', 'secure'],
    accent: '#334155'
  },
  {
    name: 'Folding Utility Table Steel',
    sku: 'FURN-IND-007',
    description: 'Foldable steel table for temporary counters, events, and pop-up stalls.',
    category: 'Furniture',
    price: 3299,
    costPrice: 2280,
    unit: 'piece',
    lowStockThreshold: 5,
    supplier: 'Metro Workspace Furnishings',
    tags: ['table', 'stall', 'portable'],
    accent: '#7c2d12'
  },
  {
    name: 'Powder Coated Cafe Stool',
    sku: 'FURN-IND-008',
    description: 'Compact stool suited to pantry corners, cafes, and customer touchpoints.',
    category: 'Furniture',
    price: 1499,
    costPrice: 990,
    unit: 'piece',
    lowStockThreshold: 8,
    supplier: 'Metro Workspace Furnishings',
    tags: ['stool', 'cafe', 'compact'],
    accent: '#a16207'
  },
  {
    name: 'A4 Copier Paper 500 Sheets',
    sku: 'STAT-IND-001',
    description: '80 GSM copier paper for invoices, reports, and office printing.',
    category: 'Stationery',
    price: 299,
    costPrice: 198,
    unit: 'pack',
    lowStockThreshold: 40,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['paper', 'printing', 'office'],
    accent: '#2563eb'
  },
  {
    name: 'Spiral Notebook A5',
    sku: 'STAT-IND-002',
    description: 'Ruled notebook for store logs, call notes, and team checklists.',
    category: 'Stationery',
    price: 89,
    costPrice: 52,
    unit: 'piece',
    lowStockThreshold: 50,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['notebook', 'notes', 'stationery'],
    accent: '#0f766e'
  },
  {
    name: 'Blue Gel Pen Box',
    sku: 'STAT-IND-003',
    description: 'Bulk box of smooth writing pens for reception and admin desks.',
    category: 'Stationery',
    price: 180,
    costPrice: 110,
    unit: 'box',
    lowStockThreshold: 30,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['pen', 'office', 'bulk'],
    accent: '#1d4ed8'
  },
  {
    name: 'Whiteboard Marker Set',
    sku: 'STAT-IND-004',
    description: 'Quick-dry marker set in mixed colors for meetings and training rooms.',
    category: 'Stationery',
    price: 140,
    costPrice: 88,
    unit: 'pack',
    lowStockThreshold: 24,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['marker', 'meeting', 'training'],
    accent: '#7c3aed'
  },
  {
    name: 'Brown Packaging Tape',
    sku: 'STAT-IND-005',
    description: 'Strong adhesive tape roll for dispatch boxes and stock packing.',
    category: 'Stationery',
    price: 65,
    costPrice: 38,
    unit: 'piece',
    lowStockThreshold: 60,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['packaging', 'dispatch', 'tape'],
    accent: '#92400e'
  },
  {
    name: 'Barcode Label Roll',
    sku: 'STAT-IND-006',
    description: 'Thermal printable label roll for SKU stickers and shelf labels.',
    category: 'Stationery',
    price: 220,
    costPrice: 150,
    unit: 'pack',
    lowStockThreshold: 20,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['barcode', 'label', 'thermal'],
    accent: '#0369a1'
  },
  {
    name: 'Permanent Marker Box',
    sku: 'STAT-IND-007',
    description: 'Permanent markers for carton marking, dispatch, and warehouse use.',
    category: 'Stationery',
    price: 210,
    costPrice: 142,
    unit: 'box',
    lowStockThreshold: 18,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['marker', 'warehouse', 'carton'],
    accent: '#be123c'
  },
  {
    name: 'Document File Folder Pack',
    sku: 'STAT-IND-008',
    description: 'Transparent file folders for bills, vendor records, and compliance docs.',
    category: 'Stationery',
    price: 160,
    costPrice: 100,
    unit: 'pack',
    lowStockThreshold: 18,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['folder', 'file', 'records'],
    accent: '#0284c7'
  },
  {
    name: 'Thermal Paper Roll 2 Inch',
    sku: 'STAT-IND-009',
    description: 'POS printer paper rolls for receipts and billing counters.',
    category: 'Stationery',
    price: 230,
    costPrice: 158,
    unit: 'pack',
    lowStockThreshold: 25,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['receipt', 'billing', 'paper'],
    accent: '#334155'
  },
  {
    name: 'Desk Calculator 12 Digit',
    sku: 'STAT-IND-010',
    description: 'Basic calculator for store accounts, cash counters, and admin work.',
    category: 'Stationery',
    price: 350,
    costPrice: 240,
    unit: 'piece',
    lowStockThreshold: 12,
    supplier: 'PaperGrid Office Supply Co.',
    tags: ['calculator', 'accounting', 'desk'],
    accent: '#0f766e'
  },
  {
    name: 'Cotton Polo T-Shirt Navy',
    sku: 'APRL-IND-001',
    description: 'Uniform-ready polo t-shirt for retail and warehouse staff.',
    category: 'Apparel',
    price: 399,
    costPrice: 250,
    unit: 'piece',
    lowStockThreshold: 30,
    supplier: 'Shakti Uniforms Private Limited',
    tags: ['uniform', 'apparel', 'staff'],
    accent: '#1e3a8a'
  },
  {
    name: 'Reflective Safety Jacket',
    sku: 'APRL-IND-002',
    description: 'High-visibility jacket for loading bays and late-hour operations.',
    category: 'Apparel',
    price: 299,
    costPrice: 188,
    unit: 'piece',
    lowStockThreshold: 24,
    supplier: 'Shakti Uniforms Private Limited',
    tags: ['safety', 'warehouse', 'jacket'],
    accent: '#f59e0b'
  },
  {
    name: 'Disposable Hair Net Pack',
    sku: 'APRL-IND-003',
    description: 'Hair nets for kitchen, food packing, and hygiene-sensitive areas.',
    category: 'Apparel',
    price: 120,
    costPrice: 75,
    unit: 'pack',
    lowStockThreshold: 35,
    supplier: 'Shakti Uniforms Private Limited',
    tags: ['hygiene', 'kitchen', 'pack'],
    accent: '#0ea5e9'
  },
  {
    name: 'Nitrile Gloves Box',
    sku: 'APRL-IND-004',
    description: 'Protective gloves for cleaning, packing, and handling operations.',
    category: 'Apparel',
    price: 420,
    costPrice: 290,
    unit: 'box',
    lowStockThreshold: 20,
    supplier: 'Shakti Uniforms Private Limited',
    tags: ['gloves', 'ppe', 'safety'],
    accent: '#0f766e'
  },
  {
    name: 'Cotton Cleaning Cloth',
    sku: 'APRL-IND-005',
    description: 'Reusable wiping cloth for counters, displays, and equipment cleaning.',
    category: 'Apparel',
    price: 55,
    costPrice: 28,
    unit: 'piece',
    lowStockThreshold: 60,
    supplier: 'Shakti Uniforms Private Limited',
    tags: ['cloth', 'cleaning', 'utility'],
    accent: '#475569'
  },
  {
    name: 'Waterproof Kitchen Apron',
    sku: 'APRL-IND-006',
    description: 'Splash-resistant apron for cooking, demos, and cafe counters.',
    category: 'Apparel',
    price: 180,
    costPrice: 112,
    unit: 'piece',
    lowStockThreshold: 20,
    supplier: 'Shakti Uniforms Private Limited',
    tags: ['apron', 'kitchen', 'uniform'],
    accent: '#7c2d12'
  },
  {
    name: 'Industrial Face Mask Box',
    sku: 'APRL-IND-007',
    description: 'Multi-layer masks for dusty work areas and high-footfall counters.',
    category: 'Apparel',
    price: 260,
    costPrice: 170,
    unit: 'box',
    lowStockThreshold: 22,
    supplier: 'Shakti Uniforms Private Limited',
    tags: ['mask', 'ppe', 'industrial'],
    accent: '#0284c7'
  },
  {
    name: 'Worker Cap Pack',
    sku: 'APRL-IND-008',
    description: 'Lightweight caps for staff uniforms in retail and service operations.',
    category: 'Apparel',
    price: 150,
    costPrice: 90,
    unit: 'pack',
    lowStockThreshold: 18,
    supplier: 'Shakti Uniforms Private Limited',
    tags: ['cap', 'uniform', 'staff'],
    accent: '#be123c'
  },
  {
    name: 'Corrugated Carton Sheet',
    sku: 'RAW-IND-001',
    description: 'Heavy-duty corrugated sheet used for carton making and padding.',
    category: 'Raw Materials',
    price: 42,
    costPrice: 25,
    unit: 'piece',
    lowStockThreshold: 80,
    supplier: 'Prime Pack Materials',
    tags: ['carton', 'packaging', 'corrugated'],
    accent: '#92400e'
  },
  {
    name: 'HDPE Granules Natural',
    sku: 'RAW-IND-002',
    description: 'Natural HDPE granules for molding and packaging applications.',
    category: 'Raw Materials',
    price: 145,
    costPrice: 118,
    unit: 'kg',
    lowStockThreshold: 60,
    supplier: 'Prime Pack Materials',
    tags: ['plastic', 'granules', 'manufacturing'],
    accent: '#2563eb'
  },
  {
    name: 'Industrial Adhesive Glue 5L',
    sku: 'RAW-IND-003',
    description: 'Fast-bonding adhesive for carton sealing and product assembly.',
    category: 'Raw Materials',
    price: 1150,
    costPrice: 840,
    unit: 'liter',
    lowStockThreshold: 15,
    supplier: 'Prime Pack Materials',
    tags: ['adhesive', 'packing', 'factory'],
    accent: '#0f766e'
  },
  {
    name: 'Aluminium Foil Roll Industrial',
    sku: 'RAW-IND-004',
    description: 'Food-grade foil roll for packaging, wrapping, and lining use.',
    category: 'Raw Materials',
    price: 780,
    costPrice: 560,
    unit: 'piece',
    lowStockThreshold: 20,
    supplier: 'Prime Pack Materials',
    tags: ['foil', 'food-packaging', 'roll'],
    accent: '#64748b'
  },
  {
    name: 'Bubble Wrap Roll',
    sku: 'RAW-IND-005',
    description: 'Protective bubble wrap for fragile electronics and home goods.',
    category: 'Raw Materials',
    price: 650,
    costPrice: 460,
    unit: 'piece',
    lowStockThreshold: 14,
    supplier: 'Prime Pack Materials',
    tags: ['bubble-wrap', 'fragile', 'shipping'],
    accent: '#0ea5e9'
  },
  {
    name: 'Cotton Wick Bundle',
    sku: 'RAW-IND-006',
    description: 'Cotton wick bundle for lamp, pooja, and devotional retail stock.',
    category: 'Raw Materials',
    price: 90,
    costPrice: 54,
    unit: 'pack',
    lowStockThreshold: 30,
    supplier: 'Prime Pack Materials',
    tags: ['cotton', 'pooja', 'bundle'],
    accent: '#f59e0b'
  },
  {
    name: 'PET Bottle 1L Empty',
    sku: 'RAW-IND-007',
    description: 'Transparent PET bottles for oil, cleaner, and refillable products.',
    category: 'Raw Materials',
    price: 18,
    costPrice: 11,
    unit: 'piece',
    lowStockThreshold: 100,
    supplier: 'Prime Pack Materials',
    tags: ['bottle', 'packaging', 'pet'],
    accent: '#1d4ed8'
  },
  {
    name: 'Kraft Paper Roll',
    sku: 'RAW-IND-008',
    description: 'Brown kraft roll for wrapping parcels and lining shipping boxes.',
    category: 'Raw Materials',
    price: 520,
    costPrice: 365,
    unit: 'piece',
    lowStockThreshold: 16,
    supplier: 'Prime Pack Materials',
    tags: ['kraft', 'wrapping', 'packing'],
    accent: '#7c2d12'
  },
  {
    name: 'Sona Masoori Rice 25kg',
    sku: 'GROC-IND-001',
    description: 'Popular medium-grain rice for restaurants, canteens, and households.',
    category: 'Groceries',
    price: 1650,
    costPrice: 1460,
    unit: 'kg',
    lowStockThreshold: 80,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['rice', 'grain', 'south-indian'],
    accent: '#15803d'
  },
  {
    name: 'Premium Basmati Rice 10kg',
    sku: 'GROC-IND-002',
    description: 'Long-grain basmati rice stocked for premium retail and festive demand.',
    category: 'Groceries',
    price: 1249,
    costPrice: 1085,
    unit: 'kg',
    lowStockThreshold: 50,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['basmati', 'rice', 'premium'],
    accent: '#65a30d'
  },
  {
    name: 'Chakki Fresh Wheat Atta 10kg',
    sku: 'GROC-IND-003',
    description: 'Stone-ground wheat flour for kirana, catering, and institutional buyers.',
    category: 'Groceries',
    price: 495,
    costPrice: 420,
    unit: 'kg',
    lowStockThreshold: 60,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['atta', 'flour', 'wheat'],
    accent: '#ca8a04'
  },
  {
    name: 'Toor Dal 5kg',
    sku: 'GROC-IND-004',
    description: 'Split pigeon peas packed for regular household and wholesale sales.',
    category: 'Groceries',
    price: 760,
    costPrice: 690,
    unit: 'kg',
    lowStockThreshold: 40,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['dal', 'pulse', 'protein'],
    accent: '#d97706'
  },
  {
    name: 'Chana Dal 5kg',
    sku: 'GROC-IND-005',
    description: 'Split Bengal gram suitable for snacks, curries, and catering use.',
    category: 'Groceries',
    price: 510,
    costPrice: 450,
    unit: 'kg',
    lowStockThreshold: 40,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['dal', 'chana', 'pulse'],
    accent: '#ea580c'
  },
  {
    name: 'Moong Dal 5kg',
    sku: 'GROC-IND-006',
    description: 'Yellow moong dal for quick cooking, canteens, and health retail.',
    category: 'Groceries',
    price: 690,
    costPrice: 620,
    unit: 'kg',
    lowStockThreshold: 35,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['dal', 'moong', 'grocery'],
    accent: '#84cc16'
  },
  {
    name: 'Poha Thick 1kg',
    sku: 'GROC-IND-007',
    description: 'Thick poha stocked for breakfast mixes and convenience shelves.',
    category: 'Groceries',
    price: 78,
    costPrice: 56,
    unit: 'pack',
    lowStockThreshold: 45,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['poha', 'breakfast', 'snacks'],
    accent: '#f59e0b'
  },
  {
    name: 'Idli Rice 10kg',
    sku: 'GROC-IND-008',
    description: 'Rice variety suited for idli, dosa batter, and catering kitchens.',
    category: 'Groceries',
    price: 690,
    costPrice: 598,
    unit: 'kg',
    lowStockThreshold: 40,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['idli', 'rice', 'south-indian'],
    accent: '#16a34a'
  },
  {
    name: 'Sulphurless Sugar 5kg',
    sku: 'GROC-IND-009',
    description: 'Refined sugar for tea stalls, bakeries, and household retail packs.',
    category: 'Groceries',
    price: 245,
    costPrice: 210,
    unit: 'kg',
    lowStockThreshold: 55,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['sugar', 'sweetener', 'baking'],
    accent: '#cbd5e1'
  },
  {
    name: 'Jaggery Powder 1kg',
    sku: 'GROC-IND-010',
    description: 'Traditional jaggery powder for healthy retail, tea, and sweets.',
    category: 'Groceries',
    price: 92,
    costPrice: 68,
    unit: 'pack',
    lowStockThreshold: 30,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['jaggery', 'natural', 'sweetener'],
    accent: '#92400e'
  },
  {
    name: 'Groundnut Oil 1L',
    sku: 'GROC-IND-011',
    description: 'Cooking oil bottle suited for kirana, mini-marts, and restaurants.',
    category: 'Groceries',
    price: 185,
    costPrice: 160,
    unit: 'liter',
    lowStockThreshold: 25,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['oil', 'groundnut', 'cooking'],
    accent: '#d97706'
  },
  {
    name: 'Sunflower Oil 1L',
    sku: 'GROC-IND-012',
    description: 'Light cooking oil for high-turnover grocery and retail inventory.',
    category: 'Groceries',
    price: 168,
    costPrice: 146,
    unit: 'liter',
    lowStockThreshold: 25,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['oil', 'sunflower', 'kitchen'],
    accent: '#facc15'
  },
  {
    name: 'Assam Tea Dust 1kg',
    sku: 'GROC-IND-013',
    description: 'Strong tea dust for hotels, tea stalls, and pantry stock.',
    category: 'Groceries',
    price: 420,
    costPrice: 360,
    unit: 'kg',
    lowStockThreshold: 18,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['tea', 'beverage', 'pantry'],
    accent: '#92400e'
  },
  {
    name: 'Filter Coffee Blend 500g',
    sku: 'GROC-IND-014',
    description: 'South Indian filter coffee blend for cafes, offices, and premium shelves.',
    category: 'Groceries',
    price: 275,
    costPrice: 225,
    unit: 'gram',
    lowStockThreshold: 35,
    supplier: 'Annapurna Wholesale Traders',
    tags: ['coffee', 'filter-coffee', 'beverage'],
    accent: '#5b3716'
  },
  {
    name: 'Detergent Powder 1kg',
    sku: 'CARE-IND-001',
    description: 'Laundry detergent pack for household, hostel, and hospitality supply.',
    category: 'Home & Personal Care',
    price: 125,
    costPrice: 88,
    unit: 'pack',
    lowStockThreshold: 36,
    supplier: 'CleanCart Essentials',
    tags: ['detergent', 'laundry', 'cleaning'],
    accent: '#0284c7'
  },
  {
    name: 'Dishwash Liquid 500ml',
    sku: 'CARE-IND-002',
    description: 'Dishwashing liquid bottle for kitchens, cafes, and pantry counters.',
    category: 'Home & Personal Care',
    price: 95,
    costPrice: 66,
    unit: 'ml',
    lowStockThreshold: 32,
    supplier: 'CleanCart Essentials',
    tags: ['dishwash', 'liquid', 'kitchen'],
    accent: '#0f766e'
  },
  {
    name: 'Floor Cleaner Citrus 1L',
    sku: 'CARE-IND-003',
    description: 'Fresh citrus floor cleaner for stores, offices, and reception areas.',
    category: 'Home & Personal Care',
    price: 165,
    costPrice: 118,
    unit: 'liter',
    lowStockThreshold: 20,
    supplier: 'CleanCart Essentials',
    tags: ['cleaner', 'floor', 'housekeeping'],
    accent: '#16a34a'
  },
  {
    name: 'Hand Wash Refill 750ml',
    sku: 'CARE-IND-004',
    description: 'Hand wash refill pouch for washrooms, clinics, and common areas.',
    category: 'Home & Personal Care',
    price: 110,
    costPrice: 76,
    unit: 'ml',
    lowStockThreshold: 28,
    supplier: 'CleanCart Essentials',
    tags: ['handwash', 'hygiene', 'refill'],
    accent: '#22c55e'
  },
  {
    name: 'Coconut Oil 500ml',
    sku: 'CARE-IND-005',
    description: 'Multi-use coconut oil bottle for personal care and wellness retail.',
    category: 'Home & Personal Care',
    price: 145,
    costPrice: 112,
    unit: 'ml',
    lowStockThreshold: 20,
    supplier: 'CleanCart Essentials',
    tags: ['coconut-oil', 'personal-care', 'wellness'],
    accent: '#f59e0b'
  },
  {
    name: 'Neem Bath Soap Pack',
    sku: 'CARE-IND-006',
    description: 'Herbal bath soap multipack for personal care aisles and hostels.',
    category: 'Home & Personal Care',
    price: 165,
    costPrice: 120,
    unit: 'pack',
    lowStockThreshold: 24,
    supplier: 'CleanCart Essentials',
    tags: ['soap', 'herbal', 'bath'],
    accent: '#65a30d'
  },
  {
    name: 'Herbal Toothpaste 150g',
    sku: 'CARE-IND-007',
    description: 'Ayurvedic-style toothpaste tube for fast-moving daily essentials.',
    category: 'Home & Personal Care',
    price: 95,
    costPrice: 68,
    unit: 'gram',
    lowStockThreshold: 30,
    supplier: 'CleanCart Essentials',
    tags: ['toothpaste', 'herbal', 'personal-care'],
    accent: '#15803d'
  },
  {
    name: 'Room Freshener Spray 300ml',
    sku: 'CARE-IND-008',
    description: 'Air freshener spray for trial rooms, offices, and washroom upkeep.',
    category: 'Home & Personal Care',
    price: 135,
    costPrice: 92,
    unit: 'ml',
    lowStockThreshold: 18,
    supplier: 'CleanCart Essentials',
    tags: ['freshener', 'spray', 'housekeeping'],
    accent: '#7c3aed'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Stock.deleteMany({}),
      Transaction.deleteMany({}),
      Supplier.deleteMany({})
    ]);
    console.log('Cleared existing data');

    const salt = await bcrypt.genSalt(12);
    const adminPwd = await bcrypt.hash('admin123', salt);
    const managerPwd = await bcrypt.hash('manager123', salt);
    const staffPwd = await bcrypt.hash('staff123', salt);

    await User.insertMany([
      { name: 'Admin User', email: 'admin@inventrack.com', password: adminPwd, role: 'admin' },
      { name: 'Manager User', email: 'manager@inventrack.com', password: managerPwd, role: 'manager' },
      { name: 'Staff User', email: 'staff@inventrack.com', password: staffPwd, role: 'staff' }
    ]);
    console.log('Users seeded: admin@inventrack.com / admin123, manager@inventrack.com / manager123, staff@inventrack.com / staff123');

    const categories = await Category.insertMany(categoryDefinitions);
    const categoryMap = Object.fromEntries(categories.map((category) => [category.name, category]));
    console.log('Categories seeded:', categories.length);

    const suppliers = await Supplier.insertMany(supplierDefinitions);
    console.log('Suppliers seeded:', suppliers.length);

    const productData = productCatalog.map(({ category, accent, ...product }) => ({
      ...product,
      category: categoryMap[category]._id,
      imageUrl: makeImageDataUrl(product.name, accent)
    }));

    const products = await Product.insertMany(productData);
    console.log('Products seeded:', products.length);

    const stockRecords = products.map((product, index) => {
      const quantity = buildQuantity(productData[index], index);
      return {
        productId: product._id.toString(),
        productName: product.name,
        sku: product.sku,
        quantity,
        reserved: buildReserved(quantity, index),
        lowStockThreshold: product.lowStockThreshold,
        location: stockLocations[index % stockLocations.length],
        unit: product.unit,
        lastUpdated: new Date()
      };
    });

    const stocks = await Stock.insertMany(stockRecords);
    console.log('Stock records seeded:', stocks.length);

    const txRecords = products.map((product, index) => ({
      productId: product._id.toString(),
      productName: product.name,
      sku: product.sku,
      type: 'IN',
      quantity: stockRecords[index].quantity,
      quantityBefore: 0,
      quantityAfter: stockRecords[index].quantity,
      reason: 'Initial stock setup'
    }));

    await Transaction.insertMany(txRecords);
    console.log('Transactions seeded:', txRecords.length);

    console.log('\nSeed complete');
    console.log('Catalog size:', products.length, 'products with image URLs');
    console.log('Login credentials:');
    console.log('Admin -> admin@inventrack.com / admin123');
    console.log('Manager -> manager@inventrack.com / manager123');
    console.log('Staff -> staff@inventrack.com / staff123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
