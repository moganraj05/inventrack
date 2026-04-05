import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { inventoryAPI } from '../services/api';
import { exportInventory } from '../services/exportService';

const TX_TYPES = [
  { value: 'IN', label: '↑ Stock In', color: 'var(--green)', desc: 'Add stock received from a supplier or warehouse.' },
  { value: 'OUT', label: '↓ Stock Out', color: 'var(--red)', desc: 'Remove stock for sale, usage, or dispatch.' },
  { value: 'ADJUSTMENT', label: '~ Adjust To', color: 'var(--gold)', desc: 'Set the exact quantity after a physical count.' },
  { value: 'RETURN', label: '↩ Return', color: 'var(--accent)', desc: 'Return inventory back into available stock.' },
  { value: 'DAMAGED', label: '✕ Damaged', color: 'var(--purple)', desc: 'Remove damaged or unusable stock.' }
];

const getSeverity = (stock) => {
  if (stock.quantity === 0) return 'out';
  if (stock.quantity <= stock.lowStockThreshold / 2) return 'critical';
  if (stock.quantity <= stock.lowStockThreshold) return 'low';
  return 'healthy';
};

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState({ locations: [], statuses: [] });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStock') === 'true');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [adjustModal, setAdjustModal] = useState({ open: false, stock: null });
  const [adjustForm, setAdjustForm] = useState({ type: 'IN', quantity: '', reason: '', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const filtersActive = Boolean(search || lowStockOnly || location || status);

  const loadStock = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (lowStockOnly) params.lowStock = 'true';
      if (location) params.location = location;
      if (status) params.status = status;

      const [stockRes, summaryRes] = await Promise.all([
        inventoryAPI.getAll(params),
        inventoryAPI.getSummary()
      ]);

      setStocks(stockRes.data.stocks || []);
      setPagination(stockRes.data.pagination);
      setSummary(summaryRes.data.summary || null);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [location, lowStockOnly, page, search, status]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  useEffect(() => {
    inventoryAPI.getFilterMeta()
      .then((res) => setMeta(res.data.meta || { locations: [], statuses: [] }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const nextParams = {};
    if (lowStockOnly) nextParams.lowStock = 'true';
    setSearchParams(nextParams, { replace: true });
  }, [lowStockOnly, setSearchParams]);

  const currentMetrics = useMemo(() => ({
    visibleCritical: stocks.filter((stock) => getSeverity(stock) === 'critical').length,
    visibleOut: stocks.filter((stock) => getSeverity(stock) === 'out').length,
    visibleHealthy: stocks.filter((stock) => getSeverity(stock) === 'healthy').length
  }), [stocks]);

  const openAdjust = (stock) => {
    setAdjustForm({ type: 'IN', quantity: '', reason: '', reference: '', notes: '' });
    setAdjustModal({ open: true, stock });
  };

  const resetFilters = () => {
    setSearch('');
    setLowStockOnly(false);
    setLocation('');
    setStatus('');
    setPage(1);
  };

  const handleAdjust = async (event) => {
    event.preventDefault();
    if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) {
      return toast.error('Enter a valid quantity');
    }

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
    } finally {
      setSaving(false);
    }
  };

  const selectedType = TX_TYPES.find((type) => type.value === adjustForm.type);

  return (
    <div>
      <Topbar title="Inventory" subtitle="Track stock health, locations, and action-ready alerts" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Inventory</div>
            <div className="page-subtitle">{pagination?.total ?? 0} items in the current result set</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => exportInventory(stocks)}>Export</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Low Stock</div>
            <div className="stat-value" style={{ color: 'var(--gold)' }}>{summary?.lowStockCount ?? 0}</div>
            <div className="stat-sub">Items below threshold</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Critical Low</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{summary?.criticalLowStock ?? 0}</div>
            <div className="stat-sub">Half threshold or worse</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Out of Stock</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{summary?.outOfStock ?? 0}</div>
            <div className="stat-sub">Need immediate replenishment</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Healthy Stock</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{summary?.healthyStock ?? 0}</div>
            <div className="stat-sub">Comfortably above threshold</div>
          </div>
        </div>

        {(summary?.criticalLowStock > 0 || summary?.outOfStock > 0) && (
          <div className="inventory-alert-strip">
            <div>
              <strong>Attention needed:</strong> {summary?.criticalLowStock ?? 0} critically low item(s) and {summary?.outOfStock ?? 0} out-of-stock item(s).
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { setLowStockOnly(true); setStatus(''); setPage(1); }}>
              Focus Low Stock
            </button>
          </div>
        )}

        <div className="card card-sm filter-panel">
          <div className="toolbar">
            <div className="search-bar" style={{ maxWidth: 320 }}>
              <span style={{ color: 'var(--text3)' }}>⌕</span>
              <input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select className="form-control filter-control" value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }}>
              <option value="">All Locations</option>
              {meta.locations.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="form-control filter-control" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">All Stock Health</option>
              {meta.statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <button
              className={`btn ${lowStockOnly ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setLowStockOnly((prev) => !prev);
                setPage(1);
              }}
            >
              Low Stock Only
            </button>
            {filtersActive && <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset Filters</button>}
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : stocks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⊞</div>
            <h3>No inventory records</h3>
            <p>Adjust your filters or add products to start tracking stock.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Threshold</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const severity = getSeverity(stock);
                  return (
                    <tr key={stock._id} className={`stock-row stock-row-${severity}`}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{stock.productName}</div>
                        <div className="table-subtext">Updated {new Date(stock.lastUpdated).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td><span className="mono badge badge-blue">{stock.sku}</span></td>
                      <td>
                        <div className={`stock-number stock-number-${severity}`}>{stock.quantity}</div>
                        <div className="table-subtext">{stock.unit}</div>
                      </td>
                      <td><span style={{ color: 'var(--text2)' }}>{stock.reserved || 0}</span></td>
                      <td><span style={{ fontWeight: 700 }}>{stock.available ?? stock.quantity}</span></td>
                      <td><span style={{ color: 'var(--text3)' }}>{stock.lowStockThreshold}</span></td>
                      <td><span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{stock.location || 'Main Warehouse'}</span></td>
                      <td>
                        <span className={`badge ${
                          severity === 'out' ? 'badge-red' :
                          severity === 'critical' ? 'badge-red' :
                          severity === 'low' ? 'badge-yellow' :
                          'badge-green'
                        }`}>
                          {severity === 'out' ? 'Out of Stock' : severity === 'critical' ? 'Critical Low' : severity === 'low' ? 'Low Stock' : 'Healthy'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => openAdjust(stock)}>Adjust ↔</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && stocks.length > 0 && (
          <div className="toolbar" style={{ marginTop: 16, color: 'var(--text2)' }}>
            <span className="helper-text">Visible now: {currentMetrics.visibleHealthy} healthy, {currentMetrics.visibleCritical} critical, {currentMetrics.visibleOut} out of stock.</span>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal
        isOpen={adjustModal.open}
        onClose={() => setAdjustModal({ open: false, stock: null })}
        title={`Adjust Stock — ${adjustModal.stock?.productName}`}
      >
        {adjustModal.stock && (
          <div className="stock-snapshot">
            <div>
              <div className="meta-label">Current Stock</div>
              <div className={`stock-number stock-number-${getSeverity(adjustModal.stock)}`}>
                {adjustModal.stock.quantity}
              </div>
            </div>
            <div>
              <div className="meta-label">Threshold</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{adjustModal.stock.lowStockThreshold}</div>
            </div>
            <div>
              <div className="meta-label">Available</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{adjustModal.stock.available ?? adjustModal.stock.quantity}</div>
            </div>
          </div>
        )}
        <form onSubmit={handleAdjust}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Transaction Type *</label>
              <div className="type-grid">
                {TX_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`type-card ${adjustForm.type === type.value ? 'type-card-active' : ''}`}
                    style={{ '--type-color': type.color }}
                    onClick={() => setAdjustForm((prev) => ({ ...prev, type: type.value }))}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {selectedType && <div className="helper-text">{selectedType.desc}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                className="form-control"
                type="number"
                min="0.01"
                step="0.01"
                value={adjustForm.quantity}
                onChange={(event) => setAdjustForm((prev) => ({ ...prev, quantity: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <input className="form-control" value={adjustForm.reason} onChange={(event) => setAdjustForm((prev) => ({ ...prev, reason: event.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Reference</label>
              <input className="form-control" value={adjustForm.reference} onChange={(event) => setAdjustForm((prev) => ({ ...prev, reference: event.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} value={adjustForm.notes} onChange={(event) => setAdjustForm((prev) => ({ ...prev, notes: event.target.value }))} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustModal({ open: false, stock: null })}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ background: selectedType?.color, borderColor: selectedType?.color }}>
              {saving ? 'Saving...' : `Confirm ${selectedType?.label}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
