import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { supplierAPI } from '../services/api';
import { exportSuppliers } from '../services/exportService';
import { useAuth } from '../context/AuthContext';

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Immediate', 'Custom'];
const emptyForm = { name: '', email: '', phone: '', contactPerson: '', website: '', category: 'General', paymentTerms: 'Net 30', rating: 3, notes: '', isActive: true, address: { street: '', city: '', state: '', country: 'India', pincode: '' } };

export default function SuppliersPage() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewModal, setViewModal] = useState(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await supplierAPI.getAll(params);
      setSuppliers(res.data.suppliers || []);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit = (s) => { setForm({ ...s, address: s.address || emptyForm.address }); setModal({ open: true, mode: 'edit', data: s }); };

  const handleSave = async (e) => {
    e.preventDefault();
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
      setModal({ open: false });
      loadSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await supplierAPI.delete(id);
      toast.success('Supplier deleted');
      setDeleteConfirm(null);
      loadSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const f = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const fa = (k) => e => setForm(p => ({ ...p, address: { ...p.address, [k]: e.target.value } }));
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div>
      <Topbar title="Suppliers" subtitle="Manage your vendor directory" />
      <div className="page-content">
        <div className="page-header">
          <div><div className="page-title">Suppliers</div><div className="page-subtitle">{pagination?.total ?? 0} suppliers total</div></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => exportSuppliers(suppliers)} title="Export to CSV">⬇ Export</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Add Supplier</button>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-bar" style={{ maxWidth: 360 }}>
            <span style={{ color: 'var(--text3)' }}>⌕</span>
            <input placeholder="Search by name, email, contact…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>✕</button>}
          </div>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> : suppliers.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">⬢</div><h3>No suppliers found</h3><p>Add your first supplier to begin</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Supplier</th><th>Contact</th><th>Category</th><th>Payment Terms</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{s.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{s.contactPerson || '—'}</div>
                      {s.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.phone}</div>}
                    </td>
                    <td><span className="badge badge-blue">{s.category}</span></td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{s.paymentTerms}</span></td>
                    <td><span style={{ color: 'var(--yellow)', fontSize: '0.85rem', letterSpacing: 1 }}>{stars(s.rating || 3)}</span></td>
                    <td><span className={`badge ${s.isActive ? 'badge-green' : 'badge-red'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-sm" onClick={() => setViewModal(s)} title="View">⊙</button>
                        <button className="btn btn-icon btn-sm" onClick={() => openEdit(s)} title="Edit">✎</button>
                        {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(s)} title="Delete">✕</button>}
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title={modal.mode === 'create' ? 'Add Supplier' : 'Edit Supplier'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-control" placeholder="ABC Suppliers Ltd." value={form.name} onChange={f('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" placeholder="contact@supplier.com" value={form.email} onChange={f('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" placeholder="+91 98765 43210" value={form.phone} onChange={f('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-control" placeholder="Ravi Kumar" value={form.contactPerson} onChange={f('contactPerson')} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-control" placeholder="Electronics, Raw Material…" value={form.category} onChange={f('category')} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select className="form-control" value={form.paymentTerms} onChange={f('paymentTerms')}>
                {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-control" placeholder="https://supplier.com" value={form.website} onChange={f('website')} />
            </div>
            <div className="form-group">
              <label className="form-label">Rating (1–5)</label>
              <select className="form-control" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: Number(e.target.value) }))}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{stars(n)} ({n})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-control" placeholder="Chennai" value={form.address?.city} onChange={fa('city')} />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="form-control" placeholder="Tamil Nadu" value={form.address?.state} onChange={fa('state')} />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-control" placeholder="India" value={form.address?.country} onChange={fa('country')} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="form-group span-2">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} placeholder="Additional notes about this supplier…" style={{ resize: 'vertical' }} value={form.notes} onChange={f('notes')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : modal.mode === 'create' ? 'Create Supplier' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Supplier Details">
        {viewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Company', viewModal.name], ['Email', viewModal.email], ['Phone', viewModal.phone || '—'],
              ['Contact Person', viewModal.contactPerson || '—'], ['Category', viewModal.category],
              ['Payment Terms', viewModal.paymentTerms], ['Website', viewModal.website || '—'],
              ['Rating', stars(viewModal.rating || 3)],
              ['City', viewModal.address?.city || '—'], ['State', viewModal.address?.state || '—'],
              ['Country', viewModal.address?.country || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: label === 'Rating' ? 'var(--yellow)' : 'var(--text)' }}>{val}</span>
              </div>
            ))}
            {viewModal.notes && <div style={{ marginTop: 8, padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: 'var(--text2)' }}>{viewModal.notes}</div>}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setViewModal(null)}>Close</button>
          <button className="btn btn-primary" onClick={() => { openEdit(viewModal); setViewModal(null); }}>Edit</button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Supplier">
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Delete <strong style={{ color: 'var(--text)' }}>{deleteConfirm?.name}</strong>? This action cannot be undone.</p>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?._id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
