import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { getCache, setCache, invalidatePattern } from '../config/cache.js';

const CACHE_KEYS = {
  ALL_PRODUCTS: 'all_products',
  PRODUCT: (id) => `product_${id}`,
  CATEGORIES: 'all_categories'
};

// ─── PRODUCTS ───────────────────────────────────────────────────────────────

// GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, isActive } = req.query;
    const cacheKey = `${CACHE_KEYS.ALL_PRODUCTS}_${JSON.stringify(req.query)}`;

    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const query = {};
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    const result = {
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const cacheKey = CACHE_KEYS.PRODUCT(req.params.id);
    const cached = getCache(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const result = { success: true, product };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product', details: err.message });
  }
};

// POST /api/products
export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userId = req.headers['x-user-id'];
    const product = await Product.create({ ...req.body, createdBy: userId });
    await product.populate('category', 'name');

    invalidatePattern(CACHE_KEYS.ALL_PRODUCTS);
    res.status(201).json({ success: true, message: 'Product created', product });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'SKU already exists' });
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('category', 'name');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    invalidatePattern(CACHE_KEYS.ALL_PRODUCTS);
    invalidatePattern(CACHE_KEYS.PRODUCT(req.params.id));
    res.json({ success: true, message: 'Product updated', product });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'SKU already exists' });
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const role = req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    invalidatePattern(CACHE_KEYS.ALL_PRODUCTS);
    invalidatePattern(CACHE_KEYS.PRODUCT(req.params.id));
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
};

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export const getAllCategories = async (req, res) => {
  try {
    const cached = getCache(CACHE_KEYS.CATEGORIES);
    if (cached) return res.json({ ...cached, fromCache: true });

    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    const result = { success: true, categories };
    setCache(CACHE_KEYS.CATEGORIES, result, 600);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories', details: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    invalidatePattern(CACHE_KEYS.CATEGORIES);
    res.status(201).json({ success: true, message: 'Category created', category });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Category already exists' });
    res.status(500).json({ error: 'Failed to create category', details: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    invalidatePattern(CACHE_KEYS.CATEGORIES);
    res.json({ success: true, message: 'Category updated', category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category', details: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const role = req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    invalidatePattern(CACHE_KEYS.CATEGORIES);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category', details: err.message });
  }
};
