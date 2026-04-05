import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = 'mongodb+srv://moganraj:mernmogan@mernapp.0kzohrt.mongodb.net/inventrack?appName=mernapp';

// ─── Inline schemas (no imports needed) ─────────────────────────────────────
const userSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, role: { type: String, default: 'staff' }, isActive: { type: Boolean, default: true } }, { collection: 'users' });
const categorySchema = new mongoose.Schema({ name: { type: String, unique: true }, description: String, isActive: { type: Boolean, default: true } }, { collection: 'categories' });
const productSchema = new mongoose.Schema({ name: String, sku: { type: String, unique: true }, description: String, category: mongoose.Schema.Types.ObjectId, price: Number, costPrice: Number, unit: String, lowStockThreshold: Number, isActive: { type: Boolean, default: true }, tags: [String] }, { collection: 'products' });
const stockSchema = new mongoose.Schema({ productId: { type: String, unique: true }, productName: String, sku: String, quantity: Number, reserved: { type: Number, default: 0 }, lowStockThreshold: Number, location: String, unit: String, lastUpdated: Date }, { collection: 'stock' });
const transactionSchema = new mongoose.Schema({ productId: String, productName: String, sku: String, type: String, quantity: Number, quantityBefore: Number, quantityAfter: Number, reason: String }, { collection: 'transactions', timestamps: true });
const supplierSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, phone: String, contactPerson: String, category: String, paymentTerms: String, rating: Number, address: Object, isActive: { type: Boolean, default: true } }, { collection: 'suppliers' });

const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Stock = mongoose.model('Stock', stockSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing
    await Promise.all([User.deleteMany(), Category.deleteMany(), Product.deleteMany(), Stock.deleteMany(), Transaction.deleteMany(), Supplier.deleteMany()]);
    console.log('🗑  Cleared existing data');

    // Users
    const salt = await bcrypt.genSalt(12);
    const adminPwd = await bcrypt.hash('admin123', salt);
    const staffPwd = await bcrypt.hash('staff123', salt);

    const [admin, staff] = await User.insertMany([
      { name: 'Admin User', email: 'admin@inventrack.com', password: adminPwd, role: 'admin' },
      { name: 'Staff User', email: 'staff@inventrack.com', password: staffPwd, role: 'staff' }
    ]);
    console.log('👤 Users seeded: admin@inventrack.com / admin123');

    // Categories
    const categories = await Category.insertMany([
      { name: 'Electronics', description: 'Electronic devices and components' },
      { name: 'Furniture', description: 'Office and home furniture' },
      { name: 'Stationery', description: 'Office stationery and supplies' },
      { name: 'Apparel', description: 'Clothing and accessories' },
      { name: 'Raw Materials', description: 'Production raw materials' }
    ]);
    console.log('📂 Categories seeded:', categories.length);

    // Products
    const productData = [
      { name: 'Wireless Mouse', sku: 'ELEC-WM-001', description: 'Ergonomic wireless mouse with USB receiver', category: categories[0]._id, price: 799, costPrice: 450, unit: 'piece', lowStockThreshold: 20, tags: ['wireless', 'peripherals'] },
      { name: 'Mechanical Keyboard', sku: 'ELEC-KB-002', description: 'Backlit mechanical keyboard, Blue switches', category: categories[0]._id, price: 2499, costPrice: 1500, unit: 'piece', lowStockThreshold: 15, tags: ['keyboard', 'peripherals'] },
      { name: 'USB-C Hub 7-in-1', sku: 'ELEC-HB-003', description: '7-port USB-C hub with HDMI, SD card, USB 3.0', category: categories[0]._id, price: 1299, costPrice: 750, unit: 'piece', lowStockThreshold: 10, tags: ['usb', 'hub'] },
      { name: 'Office Chair - Mesh', sku: 'FURN-CH-001', description: 'Ergonomic mesh back office chair with lumbar support', category: categories[1]._id, price: 8999, costPrice: 5500, unit: 'piece', lowStockThreshold: 5, tags: ['chair', 'ergonomic'] },
      { name: 'Standing Desk 140cm', sku: 'FURN-DK-002', description: 'Height-adjustable standing desk, 140x60cm', category: categories[1]._id, price: 18999, costPrice: 12000, unit: 'piece', lowStockThreshold: 3, tags: ['desk', 'standing'] },
      { name: 'A4 Copy Paper (500 sheets)', sku: 'STAT-PP-001', description: 'Premium 80gsm A4 copy paper', category: categories[2]._id, price: 299, costPrice: 180, unit: 'pack', lowStockThreshold: 50, tags: ['paper', 'a4'] },
      { name: 'Ballpoint Pen Set (12pcs)', sku: 'STAT-PN-002', description: 'Smooth writing ballpoint pens, blue ink', category: categories[2]._id, price: 149, costPrice: 80, unit: 'pack', lowStockThreshold: 30, tags: ['pens', 'stationery'] },
      { name: 'Whiteboard Marker Set', sku: 'STAT-WM-003', description: 'Dry-erase whiteboard markers, 4 colours', category: categories[2]._id, price: 199, costPrice: 110, unit: 'pack', lowStockThreshold: 20, tags: ['markers', 'whiteboard'] },
      { name: 'Cotton Fabric (per meter)', sku: 'APPRL-CF-001', description: '100% pure cotton fabric, multiple colours', category: categories[3]._id, price: 250, costPrice: 150, unit: 'meter', lowStockThreshold: 100, tags: ['fabric', 'cotton'] },
      { name: 'Aluminium Sheet 1mm', sku: 'RAW-AL-001', description: '1mm aluminium sheet, 1m x 1m', category: categories[4]._id, price: 1200, costPrice: 800, unit: 'piece', lowStockThreshold: 25, tags: ['aluminium', 'metal'] },
    ];

    const products = await Product.insertMany(productData);
    console.log('📦 Products seeded:', products.length);

    // Stock & Transactions
    const stockQtys = [45, 12, 30, 8, 2, 200, 85, 18, 350, 60];
    const stockRecords = products.map((p, i) => ({
      productId: p._id.toString(),
      productName: p.name,
      sku: p.sku,
      quantity: stockQtys[i],
      lowStockThreshold: p.lowStockThreshold,
      location: i < 5 ? 'Warehouse A' : 'Warehouse B',
      unit: p.unit,
      lastUpdated: new Date()
    }));

    const stocks = await Stock.insertMany(stockRecords);
    console.log('📊 Stock records seeded:', stocks.length);

    // Transactions (initial stock IN)
    const txRecords = products.map((p, i) => ({
      productId: p._id.toString(), productName: p.name, sku: p.sku,
      type: 'IN', quantity: stockQtys[i], quantityBefore: 0, quantityAfter: stockQtys[i],
      reason: 'Initial stock setup'
    }));
    await Transaction.insertMany(txRecords);
    console.log('⇄  Transactions seeded:', txRecords.length);

    // Suppliers
    await Supplier.insertMany([
      { name: 'TechSupply India Pvt. Ltd.', email: 'sales@techsupply.in', phone: '+91 98765 43210', contactPerson: 'Ravi Kumar', category: 'Electronics', paymentTerms: 'Net 30', rating: 4, address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' } },
      { name: 'FurniCraft Solutions', email: 'info@furnicraft.com', phone: '+91 87654 32109', contactPerson: 'Priya Sharma', category: 'Furniture', paymentTerms: 'Net 45', rating: 5, address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' } },
      { name: 'Stationery World', email: 'orders@stationeryworld.in', phone: '+91 76543 21098', contactPerson: 'Arun Patel', category: 'Stationery', paymentTerms: 'Net 15', rating: 3, address: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' } },
      { name: 'Textile Hub Co.', email: 'sales@textilehub.in', phone: '+91 65432 10987', contactPerson: 'Meena Iyer', category: 'Apparel', paymentTerms: 'Immediate', rating: 4, address: { city: 'Tiruppur', state: 'Tamil Nadu', country: 'India' } },
      { name: 'MetalWorks Industries', email: 'supply@metalworks.com', phone: '+91 54321 09876', contactPerson: 'Suresh Nair', category: 'Raw Materials', paymentTerms: 'Net 60', rating: 4, address: { city: 'Pune', state: 'Maharashtra', country: 'India' } },
    ]);
    console.log('⬢  Suppliers seeded: 5');

    console.log('\n✅ Seed complete!\n');
    console.log('─────────────────────────────────────');
    console.log('🔑 Login Credentials:');
    console.log('   Admin → admin@inventrack.com / admin123');
    console.log('   Staff → staff@inventrack.com / staff123');
    console.log('─────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
