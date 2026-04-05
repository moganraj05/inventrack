import { validationResult } from 'express-validator';
import Supplier from '../models/Supplier.js';

// GET /api/suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive, category, minRating = '', sortBy = 'created_desc' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (category) query.category = category;
    if (minRating !== '') query.rating = { $gte: Number(minRating) };

    const sortMap = {
      created_desc: { createdAt: -1 },
      created_asc: { createdAt: 1 },
      rating_desc: { rating: -1, createdAt: -1 },
      rating_asc: { rating: 1, createdAt: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 }
    };
    const sort = sortMap[sortBy] || sortMap.created_desc;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
      Supplier.countDocuments(query)
    ]);

    res.json({
      success: true,
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suppliers', details: err.message });
  }
};

// GET /api/suppliers/:id
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ success: true, supplier });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch supplier', details: err.message });
  }
};

// POST /api/suppliers
export const createSupplier = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userId = req.headers['x-user-id'];
    const supplier = await Supplier.create({ ...req.body, createdBy: userId });
    res.status(201).json({ success: true, message: 'Supplier created', supplier });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Supplier with this email already exists' });
    res.status(500).json({ error: 'Failed to create supplier', details: err.message });
  }
};

// PUT /api/suppliers/:id
export const updateSupplier = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier updated', supplier });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to update supplier', details: err.message });
  }
};

// DELETE /api/suppliers/:id
export const deleteSupplier = async (req, res) => {
  try {
    const role = req.headers['x-user-role'];
    if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete supplier', details: err.message });
  }
};

// GET /api/suppliers/stats/summary
export const getSupplierStats = async (req, res) => {
  try {
    const [total, active, byCategory, ratingSummary, topRated, recentSuppliers] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ isActive: true }),
      Supplier.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Supplier.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            topRatedCount: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } }
          }
        }
      ]),
      Supplier.find().sort({ rating: -1, createdAt: -1 }).limit(5).select('name rating category isActive'),
      Supplier.find().sort({ createdAt: -1 }).limit(5).select('name createdAt category isActive')
    ]);

    res.json({
      success: true,
      stats: {
        total,
        active,
        inactive: total - active,
        averageRating: Number((ratingSummary[0]?.averageRating || 0).toFixed(1)),
        topRatedCount: ratingSummary[0]?.topRatedCount || 0,
        byCategory,
        topRated,
        recentSuppliers
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
};
