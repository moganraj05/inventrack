import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { categoryAPI, inventoryAPI, productAPI } from '../services/api';
import { exportProducts } from '../services/exportService';
import { useAuth } from '../context/AuthContext';

const UNITS = ['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'box', 'pack', 'dozen'];
const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'price_asc', label: 'Price Low-High' },
  { value: 'price_desc', label: 'Price High-Low' }
];

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  category: '',
  price: '',
  costPrice: '',
  unit: 'piece',
  lowStockThreshold: 10,
  tags: '',
  imageUrl: '',
  isActive: true
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN');

const ProductThumbnail = ({ product }) => {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} className="product-thumb" />;
  }

  return (
    <div className="product-thumb product-thumb-fallback">
      {(product.name || '?').slice(0, 1).toUpperCase()}
    </div>
  );
};

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const imageInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterImage, setFilterImage] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [catModal, setCatModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtersActive = Boolean(search || filterCat || filterStatus || filterImage || priceMin || priceMax || sortBy !== 'created_desc');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sortBy };
      if (search) params.search = search;
      if (filterCat) params.category = filterCat;
      if (filterStatus) params.isActive = filterStatus;
      if (filterImage) params.hasImage = filterImage;
      if (priceMin !== '') params.priceMin = priceMin;
      if (priceMax !== '') params.priceMax = priceMax;

      const res = await productAPI.getAll(params);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filterCat, filterImage, filterStatus, page, priceMax, priceMin, search, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    categoryAPI.getAll().then((r) => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const metrics = useMemo(() => ({
    withImages: products.filter((p) => Boolean(p.imageUrl)).length,
    active: products.filter((p) => p.isActive).length,
    avgPrice: products.length ? Math.round(products.reduce((sum, p) => sum + Number(p.price || 0), 0) / products.length) : 0
  }), [products]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (product) => {
    setForm({
      ...product,
      category: product.category?._id || product.category || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      imageUrl: product.imageUrl || '',
      isActive: Boolean(product.isActive)
    });
    setModal({ open: true, mode: 'edit', data: product });
  };

  const updateForm = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetFilters = () => {
    setSearch('');
    setFilterCat('');
    setFilterStatus('');
    setFilterImage('');
    setSortBy('created_desc');
    setPriceMin('');
    setPriceMax('');
    setPage(1);
  };

  const handleImageFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Please upload an image smaller than 2 MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, imageUrl: String(reader.result || '') }));
      toast.success('Product image added');
    };
    reader.onerror = () => toast.error('Failed to read image file');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name || !form.sku || !form.price || !form.category) {
      return toast.error('Fill all required fields');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : []
      };

      if (modal.mode === 'create') {
        const res = await productAPI.create(payload);
        try {
          await inventoryAPI.initialize({
            productId: res.data.product._id,
            productName: res.data.product.name,
            sku: res.data.product.sku,
            quantity: 0,
            lowStockThreshold: form.lowStockThreshold || 10,
            unit: form.unit
          });
        } catch {
          // Best-effort stock bootstrap.
        }
        toast.success('Product created and stock initialized');
      } else {
        await productAPI.update(modal.data._id, payload);
        toast.success('Product updated');
      }

      setModal({ open: false, mode: 'create', data: null });
      setForm(emptyForm);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      setDeleteConfirm(null);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    if (!catForm.name) return toast.error('Category name required');

    try {
      await categoryAPI.create(catForm);
      toast.success('Category created');
      setCatModal(false);
      setCatForm({ name: '', description: '' });
      const res = await categoryAPI.getAll();
      setCategories(res.data.categories || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create category');
    }
  };

  return (
    <div>
      <Topbar title="Products" subtitle="Manage your catalogue with richer media and smarter filters" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Products</div>
            <div className="page-subtitle">{pagination?.total ?? 0} products total</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => exportProducts(products)}>Export</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setCatModal(true)}>+ Category</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Showing</div>
            <div className="stat-value">{products.length}</div>
            <div className="stat-sub">Products on this page</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">With Images</div>
            <div className="stat-value" style={{ color: 'var(--cyan)' }}>{metrics.withImages}</div>
            <div className="stat-sub">Visual catalog coverage</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{metrics.active}</div>
            <div className="stat-sub">Ready for operations</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Price</div>
            <div className="stat-value" style={{ color: 'var(--gold)' }}>₹{formatCurrency(metrics.avgPrice)}</div>
            <div className="stat-sub">Across the current result set</div>
          </div>
        </div>

        <div className="card card-sm filter-panel">
          <div className="toolbar">
            <div className="search-bar" style={{ maxWidth: 320 }}>
              <span style={{ color: 'var(--text3)' }}>⌕</span>
              <input
                placeholder="Search name, SKU, description..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select className="form-control filter-control" value={filterCat} onChange={(event) => { setFilterCat(event.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
            <select className="form-control filter-control" value={filterStatus} onChange={(event) => { setFilterStatus(event.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select className="form-control filter-control" value={filterImage} onChange={(event) => { setFilterImage(event.target.value); setPage(1); }}>
              <option value="">All Media</option>
              <option value="true">With Image</option>
              <option value="false">Without Image</option>
            </select>
            <select className="form-control filter-control" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="toolbar">
            <input
              className="form-control filter-control"
              type="number"
              min="0"
              placeholder="Min price"
              value={priceMin}
              onChange={(event) => {
                setPriceMin(event.target.value);
                setPage(1);
              }}
            />
            <input
              className="form-control filter-control"
              type="number"
              min="0"
              placeholder="Max price"
              value={priceMax}
              onChange={(event) => {
                setPriceMax(event.target.value);
                setPage(1);
              }}
            />
            {filtersActive && (
              <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset Filters</button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">□</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters or create a new product.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Media</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <ProductThumbnail product={product} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{product.name}</div>
                          {product.description && (
                            <div className="table-subtext">
                              {product.description.slice(0, 78)}
                              {product.description.length > 78 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="mono badge badge-blue">{product.sku}</span></td>
                    <td><span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{product.category?.name || '-'}</span></td>
                    <td>
                      <span style={{ fontWeight: 700 }}>₹{formatCurrency(product.price)}</span>
                      {Number(product.costPrice) > 0 && (
                        <div className="table-subtext">Cost: ₹{formatCurrency(product.costPrice)}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${product.imageUrl ? 'badge-green' : 'badge-purple'}`}>
                        {product.imageUrl ? 'Image Ready' : 'No Image'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.isActive ? 'badge-green' : 'badge-red'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-sm" onClick={() => openEdit(product)} title="Edit">✎</button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(product)} title="Delete">✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', data: null })}
        title={modal.mode === 'create' ? 'Add Product' : 'Edit Product'}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group span-2">
              <label className="form-label">Product Image</label>
              <div className="image-upload-panel">
                <div className="image-upload-preview">
                  {form.imageUrl ? <img src={form.imageUrl} alt={form.name || 'Product preview'} /> : <span>Preview</span>}
                </div>
                <div className="image-upload-actions">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageFile}
                  />
                  <div className="toolbar" style={{ marginBottom: 0 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => imageInputRef.current?.click()}>
                      Upload Image
                    </button>
                    {form.imageUrl && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    className="form-control"
                    placeholder="Or paste an image URL"
                    value={form.imageUrl}
                    onChange={updateForm('imageUrl')}
                  />
                  <div className="helper-text">You can upload an image from your computer or paste a public image URL.</div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-control" placeholder="Wireless Mouse" value={form.name} onChange={updateForm('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input className="form-control" placeholder="WM-001" value={form.sku} onChange={updateForm('sku')} required style={{ fontFamily: 'var(--mono)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control" value={form.category} onChange={updateForm('category')} required>
                <option value="">Select category...</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" value={form.unit} onChange={updateForm('unit')}>
                {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (₹) *</label>
              <input className="form-control" type="number" min="0" step="0.01" value={form.price} onChange={updateForm('price')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Cost Price (₹)</label>
              <input className="form-control" type="number" min="0" step="0.01" value={form.costPrice} onChange={updateForm('costPrice')} />
            </div>
            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input className="form-control" type="number" min="0" value={form.lowStockThreshold} onChange={updateForm('lowStockThreshold')} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={String(form.isActive)}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="form-group span-2">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={updateForm('description')} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group span-2">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-control" placeholder="electronics, peripherals" value={form.tags} onChange={updateForm('tags')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={catModal} onClose={() => setCatModal(false)} title="Add Category">
        <form onSubmit={handleCreateCategory}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input
                className="form-control"
                placeholder="Electronics"
                value={catForm.name}
                onChange={(event) => setCatForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-control"
                placeholder="Optional description"
                value={catForm.description}
                onChange={(event) => setCatForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setCatModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Category</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Delete Product">
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.name}</strong>?
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?._id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
