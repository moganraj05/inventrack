import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { productAPI, categoryAPI, inventoryAPI } from '../services/api';
import { exportProducts } from '../services/exportService';
import { useAuth } from '../context/AuthContext';

const UNITS = ['piece', 'kg', 'gram', 'liter', 'ml', 'meter', 'cm', 'box', 'pack', 'dozen'];
const emptyForm = { name: '', sku: '', description: '', category: '', price: '', costPrice: '', unit: 'piece', lowStockThreshold: 10, tags: '', isActive: true };

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [catModal, setCatModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterCat) params.category = filterCat;
      const res = await productAPI.getAll(params);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load products');
    } finally { setLoading(false); }
  }, [page, search, filterCat]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit = (p) => {
    setForm({ ...p, category: p.category?._id || p.category || '', tags: Array.isArray(p.tags) ? p.tags.join(', ') : '' });
    setModal({ open: true, mode: 'edit', data: p });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.price || !form.category) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      if (modal.mode === 'create') {
        const res = await productAPI.create(payload);
        // Auto-initialize stock
        try {
          const cat = categories.find(c => c._id === form.category);
          await inventoryAPI.initialize({
            productId: res.data.product._id,
            productName: res.data.product.name,
            sku: res.data.product.sku,
            quantity: 0,
            lowStockThreshold: form.lowStockThreshold || 10,
            unit: form.unit
          });
        } catch (e) { /* stock already exists or optional */ }
        toast.success('Product created & stock initialized');
      } else {
        await productAPI.update(modal.data._id, payload);
        toast.success('Product updated');
      }
      setModal({ open: false, mode: 'create', data: null });
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      setDeleteConfirm(null);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
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

  const f = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <Topbar title="Products" subtitle="Manage your product catalogue" />
      <div className="page-content">
        <div className="page-header">
          <div><div className="page-title">Products</div><div className="page-subtitle">{pagination?.total ?? 0} products total</div></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => exportProducts(products)} title="Export to CSV">⬇ Export</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setCatModal(true)}>+ Category</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <span style={{ color: 'var(--text3)' }}>⌕</span>
            <input placeholder="Search products…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>✕</button>}
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? <div className="loading-center"><div className="spinner" /></div> : products.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">⬡</div><h3>No products found</h3><p>Create your first product to get started</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Unit</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }}>{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td><span className="mono badge badge-blue">{p.sku}</span></td>
                    <td><span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{p.category?.name || '—'}</span></td>
                    <td><span style={{ fontWeight: 600 }}>₹{Number(p.price).toLocaleString('en-IN')}</span>{p.costPrice > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Cost: ₹{Number(p.costPrice).toLocaleString('en-IN')}</div>}</td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{p.unit}</span></td>
                    <td><span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-sm" onClick={() => openEdit(p)} title="Edit">✎</button>
                        {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(p)} title="Delete">✕</button>}
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

      {/* Product Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Add Product' : 'Edit Product'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input className="form-control" placeholder="e.g. Wireless Mouse" value={form.name} onChange={f('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input className="form-control" placeholder="e.g. WM-001" value={form.sku} onChange={f('sku')} required style={{ fontFamily: 'var(--mono)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control" value={form.category} onChange={f('category')} required>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-control" value={form.unit} onChange={f('unit')}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (₹) *</label>
              <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={f('price')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Cost Price (₹)</label>
              <input className="form-control" type="number" min="0" step="0.01" placeholder="0.00" value={form.costPrice} onChange={f('costPrice')} />
            </div>
            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input className="form-control" type="number" min="0" value={form.lowStockThreshold} onChange={f('lowStockThreshold')} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="form-group span-2">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} placeholder="Product description…" value={form.description} onChange={f('description')} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group span-2">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-control" placeholder="e.g. electronics, peripherals" value={form.tags} onChange={f('tags')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : modal.mode === 'create' ? 'Create Product' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={catModal} onClose={() => setCatModal(false)} title="Add Category">
        <form onSubmit={handleCreateCategory}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input className="form-control" placeholder="e.g. Electronics" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-control" placeholder="Optional description" value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setCatModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Category</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Product">
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?._id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
