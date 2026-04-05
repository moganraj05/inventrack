import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { supplierAPI } from '../services/api';
import { exportSuppliers } from '../services/exportService';
import { useAuth } from '../context/AuthContext';

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom'];
const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest First' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'rating_asc', label: 'Lowest Rated' },
  { value: 'name_asc', label: 'Name A-Z' }
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  contactPerson: '',
  website: '',
  category: 'General',
  paymentTerms: 'Net 30',
  rating: 3,
  notes: '',
  isActive: true,
  address: { street: '', city: '', state: '', country: 'India', pincode: '' }
};

const stars = (count) => '★'.repeat(count) + '☆'.repeat(5 - count);

export default function SuppliersPage() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewModal, setViewModal] = useState(null);

  const filtersActive = Boolean(search || filterCategory || filterStatus || minRating || sortBy !== 'created_desc');

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sortBy };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.isActive = filterStatus;
      if (minRating) params.minRating = minRating;

      const res = await supplierAPI.getAll(params);
      setSuppliers(res.data.suppliers || []);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, minRating, page, search, sortBy]);

  const loadStats = useCallback(async () => {
    try {
      const res = await supplierAPI.getStats();
      setStats(res.data.stats);
    } catch {
      // Non-blocking dashboard data.
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const categoryOptions = useMemo(
    () => (stats?.byCategory || []).map((item) => item._id).filter(Boolean),
    [stats]
  );

  const featuredCategories = useMemo(() => (stats?.byCategory || []).slice(0, 5), [stats]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (supplier) => {
    setForm({
      ...supplier,
      address: {
        ...emptyForm.address,
        ...(supplier.address || {})
      },
      rating: supplier.rating || 3,
      isActive: Boolean(supplier.isActive)
    });
    setModal({ open: true, mode: 'edit', data: supplier });
  };

  const updateForm = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const updateAddress = (key) => (event) => setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: event.target.value } }));

  const resetFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterStatus('');
    setMinRating('');
    setSortBy('created_desc');
    setPage(1);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');

    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await supplierAPI.create(form);
        toast.success('Supplier created');
      } else {
        await supplierAPI.update(modal.data._id, form);
        toast.success('Supplier updated');
      }
      setModal({ open: false, mode: 'create', data: null });
      loadSuppliers();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await supplierAPI.delete(id);
      toast.success('Supplier deleted');
      setDeleteConfirm(null);
      loadSuppliers();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete supplier');
    }
  };

  return (
    <div>
      <Topbar title="Suppliers" subtitle="Track vendor health, quality, and engagement from one place" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Suppliers</div>
            <div className="page-subtitle">{pagination?.total ?? 0} suppliers in the current view</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => exportSuppliers(suppliers)}>Export</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Add Supplier</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Suppliers</div>
            <div className="stat-value">{stats?.total ?? 0}</div>
            <div className="stat-sub">Across the directory</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Vendors</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats?.active ?? 0}</div>
            <div className="stat-sub">{stats?.inactive ?? 0} inactive records</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Rating</div>
            <div className="stat-value" style={{ color: 'var(--gold)' }}>{stats?.averageRating ?? 0}</div>
            <div className="stat-sub">Based on current supplier scores</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Top Rated</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats?.topRatedCount ?? 0}</div>
            <div className="stat-sub">Rated 4 stars and above</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card card-sm">
            <div className="section-heading">Supplier Category Breakdown</div>
            <div className="chip-grid">
              {featuredCategories.length === 0 ? (
                <div className="helper-text">Categories will appear here as suppliers are added.</div>
              ) : (
                featuredCategories.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className={`chip ${filterCategory === item._id ? 'chip-active' : ''}`}
                    onClick={() => {
                      setFilterCategory(filterCategory === item._id ? '' : item._id);
                      setPage(1);
                    }}
                  >
                    <span>{item._id}</span>
                    <strong>{item.count}</strong>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="card card-sm">
            <div className="section-heading">Top Rated Suppliers</div>
            <div className="stack-list">
              {(stats?.topRated || []).slice(0, 4).map((supplier) => (
                <div key={supplier._id} className="mini-row">
                  <div>
                    <div style={{ fontWeight: 700 }}>{supplier.name}</div>
                    <div className="table-subtext">{supplier.category}</div>
                  </div>
                  <div style={{ color: 'var(--gold)', fontSize: '0.82rem' }}>{stars(supplier.rating || 3)}</div>
                </div>
              ))}
              {(!stats?.topRated || stats.topRated.length === 0) && (
                <div className="helper-text">Top-rated supplier insights will appear here.</div>
              )}
            </div>
          </div>
        </div>

        <div className="card card-sm filter-panel">
          <div className="toolbar">
            <div className="search-bar" style={{ maxWidth: 360 }}>
              <span style={{ color: 'var(--text3)' }}>⌕</span>
              <input
                placeholder="Search name, email, contact, city..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select className="form-control filter-control" value={filterCategory} onChange={(event) => { setFilterCategory(event.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select className="form-control filter-control" value={filterStatus} onChange={(event) => { setFilterStatus(event.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select className="form-control filter-control" value={minRating} onChange={(event) => { setMinRating(event.target.value); setPage(1); }}>
              <option value="">Any Rating</option>
              <option value="4">4★ and above</option>
              <option value="3">3★ and above</option>
              <option value="2">2★ and above</option>
            </select>
            <select className="form-control filter-control" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {filtersActive && <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset Filters</button>}
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : suppliers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⬢</div>
            <h3>No suppliers found</h3>
            <p>Adjust your filters or add a new supplier.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Category</th>
                  <th>Payment Terms</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{supplier.name}</div>
                      <div className="table-subtext">{supplier.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{supplier.contactPerson || '-'}</div>
                      <div className="table-subtext">{supplier.phone || supplier.address?.city || '-'}</div>
                    </td>
                    <td><span className="badge badge-blue">{supplier.category}</span></td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{supplier.paymentTerms}</span></td>
                    <td><span style={{ color: 'var(--gold)', fontSize: '0.84rem', letterSpacing: 1 }}>{stars(supplier.rating || 3)}</span></td>
                    <td>
                      <span className={`badge ${supplier.isActive ? 'badge-green' : 'badge-red'}`}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-sm" onClick={() => setViewModal(supplier)} title="View">⊙</button>
                        <button className="btn btn-icon btn-sm" onClick={() => openEdit(supplier)} title="Edit">✎</button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(supplier)} title="Delete">✕</button>
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
        title={modal.mode === 'create' ? 'Add Supplier' : 'Edit Supplier'}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-control" value={form.name} onChange={updateForm('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" value={form.email} onChange={updateForm('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={updateForm('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-control" value={form.contactPerson} onChange={updateForm('contactPerson')} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-control" value={form.category} onChange={updateForm('category')} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select className="form-control" value={form.paymentTerms} onChange={updateForm('paymentTerms')}>
                {PAYMENT_TERMS.map((term) => <option key={term} value={term}>{term}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-control" value={form.website} onChange={updateForm('website')} />
            </div>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <select className="form-control" value={form.rating} onChange={(event) => setForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>{stars(rating)} ({rating})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-control" value={form.address?.city || ''} onChange={updateAddress('city')} />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="form-control" value={form.address?.state || ''} onChange={updateAddress('state')} />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-control" value={form.address?.country || ''} onChange={updateAddress('country')} />
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
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={updateForm('notes')} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : modal.mode === 'create' ? 'Create Supplier' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(viewModal)} onClose={() => setViewModal(null)} title="Supplier Details">
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Company', viewModal.name],
              ['Email', viewModal.email],
              ['Phone', viewModal.phone || '-'],
              ['Contact Person', viewModal.contactPerson || '-'],
              ['Category', viewModal.category || '-'],
              ['Payment Terms', viewModal.paymentTerms || '-'],
              ['Website', viewModal.website || '-'],
              ['Rating', stars(viewModal.rating || 3)],
              ['City', viewModal.address?.city || '-'],
              ['State', viewModal.address?.state || '-'],
              ['Country', viewModal.address?.country || '-']
            ].map(([label, value]) => (
              <div key={label} className="mini-row">
                <span className="meta-label">{label}</span>
                <span style={{ color: label === 'Rating' ? 'var(--gold)' : 'var(--text)' }}>{value}</span>
              </div>
            ))}
            {viewModal.notes && <div className="note-block">{viewModal.notes}</div>}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setViewModal(null)}>Close</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              openEdit(viewModal);
              setViewModal(null);
            }}
          >
            Edit
          </button>
        </div>
      </Modal>

      <Modal isOpen={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Delete Supplier">
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>
          Delete <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.name}</strong>? This action cannot be undone.
        </p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?._id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
