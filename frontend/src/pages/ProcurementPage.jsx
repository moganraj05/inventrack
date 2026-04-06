import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { procurementAPI } from '../services/api';

const priorityColor = {
  critical: 'badge-red',
  high: 'badge-purple',
  medium: 'badge-yellow',
  low: 'badge-green'
};

const decisionColor = {
  recommended: 'badge-blue',
  approved: 'badge-green',
  ordered: 'badge-purple',
  deferred: 'badge-gold',
  rejected: 'badge-red'
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN');

const ProductThumb = ({ item }) => {
  if (item.imageUrl) {
    return <img src={item.imageUrl} alt={item.name} className="product-thumb" />;
  }

  return <div className="product-thumb product-thumb-fallback">{item.name?.slice(0, 1)?.toUpperCase() || '?'}</div>;
};

export default function ProcurementPage() {
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ categories: [], statuses: [], priorities: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [decisionModal, setDecisionModal] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    status: 'approved',
    finalQuantity: '',
    selectedSupplierId: '',
    selectedSupplierName: '',
    managerNote: ''
  });

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await procurementAPI.getRecommendations({
        page,
        limit: 12,
        search,
        priority,
        status,
        category
      });

      setRecommendations(res.data.recommendations || []);
      setPagination(res.data.pagination || null);
      setFilters(res.data.filters || { categories: [], statuses: [], priorities: [] });
      setSummary(res.data.summary || null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load procurement recommendations');
    } finally {
      setLoading(false);
    }
  }, [category, page, priority, search, status]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const metrics = useMemo(
    () => ({
      visibleProjectedSpend: recommendations.reduce((sum, item) => sum + Number(item.projectedSpend || 0), 0),
      criticalVisible: recommendations.filter((item) => item.priority === 'critical').length,
      approvedVisible: recommendations.filter((item) => item.recommendationStatus === 'approved').length
    }),
    [recommendations]
  );

  const resetFilters = () => {
    setSearch('');
    setPriority('');
    setStatus('');
    setCategory('');
    setPage(1);
  };

  const openDecisionModal = (item) => {
    setDecisionModal(item);
    setDecisionForm({
      status: item.recommendationStatus === 'recommended' ? 'approved' : item.recommendationStatus,
      finalQuantity: item.decision?.finalQuantity || item.recommendedQty,
      selectedSupplierId: item.decision?.selectedSupplierId || item.suggestedSupplier?.supplierId || '',
      selectedSupplierName: item.decision?.selectedSupplierName || item.suggestedSupplier?.name || item.supplier || '',
      managerNote: item.decision?.managerNote || ''
    });
  };

  const submitDecision = async () => {
    if (!decisionModal) return;

    setSaving(true);
    try {
      await procurementAPI.updateDecision(decisionModal.productId, {
        ...decisionForm,
        finalQuantity: decisionForm.finalQuantity === '' ? decisionModal.recommendedQty : Number(decisionForm.finalQuantity)
      });
      toast.success('Procurement decision saved');
      setDecisionModal(null);
      loadRecommendations();
    } catch (err) {
      const validationMessage = err.response?.data?.errors?.[0]?.msg;
      toast.error(validationMessage || err.response?.data?.error || 'Failed to save decision');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar title="Procurement" subtitle="Manager and admin procurement recommendations with supplier scoring" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="page-title">Procurement Recommendations</div>
            <div className="page-subtitle">{pagination?.total ?? 0} products evaluated for replenishment</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={loadRecommendations}>Refresh</button>
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset Filters</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Critical Items</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{summary?.criticalCount ?? 0}</div>
            <div className="stat-sub">Immediate procurement attention</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Decisions</div>
            <div className="stat-value" style={{ color: 'var(--gold)' }}>{summary?.pendingCount ?? 0}</div>
            <div className="stat-sub">Still awaiting manager action</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Projected Spend</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>₹{formatCurrency(summary?.projectedSpend ?? 0)}</div>
            <div className="stat-sub">All recommended purchase value</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Visible Queue</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{recommendations.length}</div>
            <div className="stat-sub">{metrics.criticalVisible} critical on this page</div>
          </div>
        </div>

        <div className="card card-sm filter-panel">
          <div className="toolbar">
            <div className="search-bar" style={{ maxWidth: 320 }}>
              <span style={{ color: 'var(--text3)' }}>⌕</span>
              <input
                placeholder="Search product, SKU, supplier..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select className="form-control filter-control" value={priority} onChange={(event) => { setPriority(event.target.value); setPage(1); }}>
              <option value="">All Priorities</option>
              {filters.priorities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="form-control filter-control" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">All Decisions</option>
              {filters.statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="form-control filter-control" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {filters.categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="toolbar" style={{ justifyContent: 'space-between' }}>
            <div className="helper-text">
              Visible projected spend: ₹{formatCurrency(metrics.visibleProjectedSpend)} • Approved on this page: {metrics.approvedVisible}
            </div>
            <div className="helper-text">
              Managers can approve, defer, reject, or mark orders as placed.
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : recommendations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◎</div>
            <h3>No procurement recommendations found</h3>
            <p>Try resetting the filters or refresh after new stock movements.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock Health</th>
                  <th>Recommended Order</th>
                  <th>Suggested Supplier</th>
                  <th>Decision</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <div className="product-cell">
                        <ProductThumb item={item} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          <div className="table-subtext">{item.sku} • {item.category}</div>
                          <div className="table-subtext">{item.stockLocation}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.available} {item.unit} available</div>
                      <div className="table-subtext">Threshold {item.lowStockThreshold} • Daily use {item.dailyUsage}</div>
                      <div className="table-subtext">
                        {item.stockoutDays === null ? 'Long coverage' : `${item.stockoutDays} days left`} • Risk {item.riskScore}/100
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span className={`badge ${priorityColor[item.priority] || 'badge-blue'}`}>{item.priority}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.recommendedQty} {item.unit}</div>
                      <div className="table-subtext">Reorder point {item.reorderPoint}</div>
                      <div className="table-subtext">Projected spend ₹{formatCurrency(item.projectedSpend)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.suggestedSupplier?.name || item.supplier || 'No supplier match'}</div>
                      {item.suggestedSupplier ? (
                        <>
                          <div className="table-subtext">
                            Rating {item.suggestedSupplier.rating}/5 • Lead {item.suggestedSupplier.estimatedLeadTimeDays} days
                          </div>
                          <div className="table-subtext">{item.suggestedSupplier.paymentTerms}</div>
                        </>
                      ) : (
                        <div className="table-subtext">Add a matching supplier to improve recommendations</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${decisionColor[item.recommendationStatus] || 'badge-blue'}`}>
                        {item.recommendationStatus}
                      </span>
                      {item.decision?.managerNote && (
                        <div className="table-subtext" style={{ marginTop: 6 }}>
                          {item.decision.managerNote.slice(0, 54)}{item.decision.managerNote.length > 54 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openDecisionModal(item)}>
                        Review
                      </button>
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
        isOpen={Boolean(decisionModal)}
        onClose={() => setDecisionModal(null)}
        title={decisionModal ? `Procurement Decision — ${decisionModal.name}` : 'Procurement Decision'}
        size="lg"
      >
        {decisionModal && (
          <>
            <div className="form-grid">
              <div className="form-group span-2">
                <div className="card card-sm" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <ProductThumb item={decisionModal} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>{decisionModal.name}</div>
                      <div className="table-subtext">{decisionModal.sku} • {decisionModal.category}</div>
                      <div className="table-subtext">
                        Available {decisionModal.available} {decisionModal.unit} • Recommended {decisionModal.recommendedQty} {decisionModal.unit}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Decision</label>
                <select
                  className="form-control"
                  value={decisionForm.status}
                  onChange={(event) => setDecisionForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="approved">Approve</option>
                  <option value="ordered">Mark Ordered</option>
                  <option value="deferred">Defer</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Final Quantity</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  value={decisionForm.finalQuantity}
                  onChange={(event) => setDecisionForm((prev) => ({ ...prev, finalQuantity: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select
                  className="form-control"
                  value={decisionForm.selectedSupplierId}
                  onChange={(event) => {
                    const selected = decisionModal.supplierOptions.find((item) => item.supplierId === event.target.value);
                    setDecisionForm((prev) => ({
                      ...prev,
                      selectedSupplierId: event.target.value,
                      selectedSupplierName: selected?.name || ''
                    }));
                  }}
                >
                  <option value="">Use suggested supplier</option>
                  {decisionModal.supplierOptions.map((option) => (
                    <option key={option.supplierId} value={option.supplierId}>
                      {option.name} • score {Math.round(option.score)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Projected Spend</label>
                <div className="form-control" style={{ display: 'flex', alignItems: 'center' }}>
                  ₹{formatCurrency(
                    (Number(decisionForm.finalQuantity || decisionModal.recommendedQty) || 0) * Number(decisionModal.costPrice || 0)
                  )}
                </div>
              </div>

              <div className="form-group span-2">
                <label className="form-label">Manager Note</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={decisionForm.managerNote}
                  onChange={(event) => setDecisionForm((prev) => ({ ...prev, managerNote: event.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label">Recommendation Rationale</label>
                <div className="card card-sm">
                  <div className="stack-list">
                    {decisionModal.reasons.map((reason) => (
                      <div key={reason} className="table-subtext">{reason}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDecisionModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitDecision} disabled={saving}>
                {saving ? 'Saving...' : 'Save Decision'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
