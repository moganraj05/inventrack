import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { inventoryAPI } from '../services/api';
import { exportInventory } from '../services/exportService';

const TX_TYPES = [
  { value: 'IN', label: '↑ Stock In', color: 'var(--green)', desc: 'Add stock received from supplier' },
  { value: 'OUT', label: '↓ Stock Out', color: 'var(--red)', desc: 'Remove stock for sale/use' },
  { value: 'ADJUSTMENT', label: '~ Adjust to', color: 'var(--yellow)', desc: 'Set exact quantity (physical count)' },
  { value: 'RETURN', label: '↩ Return', color: 'var(--accent)', desc: 'Return stock from customer' },
  { value: 'DAMAGED', label: '✕ Damaged', color: 'var(--purple)', desc: 'Remove damaged/expired stock' },
];

export default function InventoryPage() {
  const [stocks, setStocks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [adjustModal, setAdjustModal] = useState({ open: false, stock: null });
  const [adjustForm, setAdjustForm] = useState({ type: 'IN', quantity: '', reason: '', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadStock = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (lowStockOnly) params.lowStock = 'true';
      const res = await inventoryAPI.getAll(params);
      setStocks(res.data.stocks || []);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally { setLoading(false); }
  }, [page, search, lowStockOnly]);

  useEffect(() => { loadStock(); }, [loadStock]);

  const openAdjust = (stock) => {
    setAdjustForm({ type: 'IN', quantity: '', reason: '', reference: '', notes: '' });
    setAdjustModal({ open: true, stock });
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) return toast.error('Enter a valid quantity');
    setSaving(true);
    try {
      await inventoryAPI.adjust(adjustModal.stock.productId, {
        ...adjustForm,
        quantity: Number(adjustForm.quantity)
      });
      toast.success('Stock adjusted successfully');
      setAdjustModal({ open: false, stock: null });
      loadStock();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to adjust stock');
    } finally { setSaving(false); }
  };

  const selectedType = TX_TYPES.find(t => t.value === adjustForm.type);

  const getStockBadge = (stock) => {
    if (stock.quantity === 0) return <span className="badge badge-red">Out of Stock</span>;
    if (stock.quantity <= stock.lowStockThreshold) return <span className="badge badge-yellow">Low Stock</span>;
    return <span className="badge badge-green">In Stock</span>;
  };

  const getQtyColor = (stock) => {
    if (stock.quantity === 0) return 'var(--red)';
    if (stock.quantity <= stock.lowStockThreshold) return 'var(--yellow)';
    return 'var(--green)';
  };

  return (
    <div>
      <Topbar title="Inventory" subtitle="Track and manage stock levels" />
      <div className="page-content">
        <div className="page-header">
          <div><div className="page-title">Inventory</div><div className="page-subtitle">{pagination?.total ?? 0} items tracked</div></div>
          <button className="btn btn-secondary btn-sm" onClick={() => exportInventory(stocks)} title="Export to CSV">⬇ Export</button>
        </div>

        <div className="toolbar">
          <div className="search-bar" style={{ maxWidth: 320 }}>
            <span style={{ color: 'var(--text3)' }}>⌕</span>
            <input placeholder="Search by name or SKU…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>✕</button>}
          </div>
          <button
            className={`btn ${lowStockOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setLowStockOnly(p => !p); setPage(1); }}>
            ⚠ Low Stock Only
          </button>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> : stocks.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">⊞</div><h3>No inventory records</h3><p>Add products first, then manage their stock here</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Reserved</th><th>Available</th><th>Threshold</th><th>Location</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s._id}>
                    <td><div style={{ fontWeight: 600 }}>{s.productName}</div></td>
                    <td><span className="mono badge badge-blue">{s.sku}</span></td>
                    <td>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: getQtyColor(s) }}>{s.quantity}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text3)', marginLeft: 4 }}>{s.unit}</span>
                    </td>
                    <td><span style={{ color: 'var(--text2)' }}>{s.reserved || 0}</span></td>
                    <td><span style={{ fontWeight: 600, color: getQtyColor(s) }}>{s.available ?? s.quantity}</span></td>
                    <td><span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>{s.lowStockThreshold}</span></td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{s.location || 'Main Warehouse'}</span></td>
                    <td>{getStockBadge(s)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(s)}>Adjust ⇄</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Adjust Stock Modal */}
      <Modal isOpen={adjustModal.open} onClose={() => setAdjustModal({ open: false, stock: null })} title={`Adjust Stock — ${adjustModal.stock?.productName}`}>
        {adjustModal.stock && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', gap: 24 }}>
            <div><div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Stock</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: getQtyColor(adjustModal.stock) }}>{adjustModal.stock.quantity} <span style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>{adjustModal.stock.unit}</span></div></div>
            <div><div style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Low Stock Alert At</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text2)' }}>{adjustModal.stock.lowStockThreshold}</div></div>
          </div>
        )}
        <form onSubmit={handleAdjust}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Transaction Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TX_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setAdjustForm(p => ({ ...p, type: t.value }))}
                    style={{ padding: '10px 12px', borderRadius: 'var(--radius)', border: `2px solid ${adjustForm.type === t.value ? t.color : 'var(--border)'}`, background: adjustForm.type === t.value ? `${t.color}18` : 'var(--bg3)', color: adjustForm.type === t.value ? t.color : 'var(--text2)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'var(--transition)', textAlign: 'left' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {selectedType && <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 4 }}>{selectedType.desc}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-control" type="number" min="0.01" step="0.01" placeholder="Enter quantity"
                value={adjustForm.quantity} onChange={e => setAdjustForm(p => ({ ...p, quantity: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <input className="form-control" placeholder="e.g. Supplier delivery, Monthly audit…"
                value={adjustForm.reason} onChange={e => setAdjustForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Reference (PO / Invoice No.)</label>
              <input className="form-control" placeholder="e.g. PO-2024-001"
                value={adjustForm.reference} onChange={e => setAdjustForm(p => ({ ...p, reference: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} placeholder="Optional notes…" style={{ resize: 'vertical' }}
                value={adjustForm.notes} onChange={e => setAdjustForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustModal({ open: false, stock: null })}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}
              style={{ background: selectedType?.color, borderColor: selectedType?.color }}>
              {saving ? 'Saving…' : `Confirm ${selectedType?.label}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
