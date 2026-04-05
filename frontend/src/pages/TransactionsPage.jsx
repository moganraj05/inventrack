import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';
import { transactionAPI } from '../services/api';
import { exportTransactions } from '../services/exportService';

const TYPE_META = {
  IN:         { label: '↑ IN',         color: 'var(--green)',  bg: 'var(--green-bg)' },
  OUT:        { label: '↓ OUT',        color: 'var(--red)',    bg: 'var(--red-bg)' },
  ADJUSTMENT: { label: '~ ADJUST',    color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  RETURN:     { label: '↩ RETURN',    color: 'var(--accent)', bg: 'var(--accent-glow)' },
  DAMAGED:    { label: '✕ DAMAGED',   color: 'var(--purple)', bg: 'var(--purple-bg)' },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);

  const loadTx = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterType) params.type = filterType;
      const res = await transactionAPI.getAll(params);
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, filterType]);

  useEffect(() => { loadTx(); }, [loadTx]);

  const qtyDisplay = (tx) => {
    const sign = ['IN', 'RETURN'].includes(tx.type) ? '+' : tx.type === 'ADJUSTMENT' ? '→' : '-';
    const color = ['IN', 'RETURN'].includes(tx.type) ? 'var(--green)' : tx.type === 'ADJUSTMENT' ? 'var(--yellow)' : 'var(--red)';
    return <span style={{ fontWeight: 700, color, fontFamily: 'var(--mono)' }}>{sign}{tx.quantity}</span>;
  };

  return (
    <div>
      <Topbar title="Transactions" subtitle="Complete stock movement history" />
      <div className="page-content">
        <div className="page-header">
          <div><div className="page-title">Transactions</div><div className="page-subtitle">{pagination?.total ?? 0} records</div></div>
          <button className="btn btn-secondary btn-sm" onClick={() => exportTransactions(transactions)} title="Export to CSV">⬇ Export</button>
        </div>

        <div className="toolbar">
          <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> : transactions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">⇄</div><h3>No transactions found</h3><p>Stock adjustments will appear here</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Date & Time</th><th>Product</th><th>SKU</th><th>Type</th><th>Qty Change</th><th>Before</th><th>After</th><th>Reason</th><th>Reference</th></tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const meta = TYPE_META[tx.type] || TYPE_META.IN;
                  return (
                    <tr key={tx._id}>
                      <td><div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</div><div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{new Date(tx.createdAt).toLocaleTimeString('en-IN')}</div></td>
                      <td><div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tx.productName}</div></td>
                      <td><span className="mono badge badge-blue">{tx.sku}</span></td>
                      <td><span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>{meta.label}</span></td>
                      <td>{qtyDisplay(tx)}</td>
                      <td><span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{tx.quantityBefore}</span></td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{tx.quantityAfter}</span></td>
                      <td><span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{tx.reason || '—'}</span></td>
                      <td><span style={{ fontSize: '0.82rem', fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{tx.reference || '—'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
