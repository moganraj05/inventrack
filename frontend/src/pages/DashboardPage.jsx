import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import { InteractiveBarChart, InteractivePieChart } from '../components/InteractiveCharts';
import { inventoryAPI, productAPI, supplierAPI } from '../services/api';

function StatCard({ icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="stat-label">{label}</span>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

const formatRelativeTime = (timestamp) => {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const txTypes = {
  IN: { color: 'var(--green)', bg: 'var(--green-bg)', label: 'Stock In' },
  OUT: { color: 'var(--red)', bg: 'var(--red-bg)', label: 'Stock Out' },
  ADJUSTMENT: { color: 'var(--gold)', bg: 'rgba(255, 215, 0, 0.15)', label: 'Adjusted' },
  RETURN: { color: 'var(--accent)', bg: 'rgba(0, 217, 255, 0.12)', label: 'Returned' },
  DAMAGED: { color: 'var(--purple)', bg: 'var(--purple-bg)', label: 'Damaged' }
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [supplierStats, setSupplierStats] = useState(null);
  const [stockHealthData, setStockHealthData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentSuppliers, setRecentSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, lowRes, prodRes, supStatsRes, allStockRes] = await Promise.allSettled([
          inventoryAPI.getSummary(),
          inventoryAPI.getLowStock(),
          productAPI.getAll({ limit: 6, page: 1, sortBy: 'created_desc' }),
          supplierAPI.getStats(),
          inventoryAPI.getAll({ limit: 1000 })
        ]);

        if (sumRes.status === 'fulfilled') {
          const nextSummary = sumRes.value.data.summary || null;
          setSummary(nextSummary);

          const txs = nextSummary?.recentTransactions || [];
          const typeCount = txs.reduce((acc, tx) => {
            acc[tx.type] = (acc[tx.type] || 0) + 1;
            return acc;
          }, {});

          setTransactionData([
            { label: 'Stock In', value: typeCount.IN || 0, color: 'var(--green)' },
            { label: 'Stock Out', value: typeCount.OUT || 0, color: 'var(--red)' },
            { label: 'Adjusted', value: typeCount.ADJUSTMENT || 0, color: 'var(--gold)' },
            { label: 'Returned', value: typeCount.RETURN || 0, color: 'var(--accent)' },
            { label: 'Damaged', value: typeCount.DAMAGED || 0, color: 'var(--purple)' }
          ].filter((item) => item.value > 0));
        }

        if (lowRes.status === 'fulfilled') {
          setLowStock(lowRes.value.data.alerts || []);
        }

        if (prodRes.status === 'fulfilled') {
          setRecentProducts(prodRes.value.data.products || []);
          setProductCount(prodRes.value.data.pagination?.total || 0);
        }

        if (supStatsRes.status === 'fulfilled') {
          const stats = supStatsRes.value.data.stats || null;
          setSupplierStats(stats);
          setSupplierCount(stats?.total || 0);
          setRecentSuppliers(stats?.recentSuppliers || []);
        }

        if (allStockRes.status === 'fulfilled') {
          const stocks = allStockRes.value.data.stocks || [];
          const inStock = stocks.filter((stock) => stock.quantity > stock.lowStockThreshold).length;
          const low = stocks.filter((stock) => stock.quantity > 0 && stock.quantity <= stock.lowStockThreshold).length;
          const out = stocks.filter((stock) => stock.quantity === 0).length;

          setStockHealthData([
            { label: 'Healthy', value: inStock, color: 'var(--green)' },
            { label: 'Low', value: low, color: 'var(--gold)' },
            { label: 'Out', value: out, color: 'var(--red)' }
          ]);
        }
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const recentActivity = useMemo(() => {
    const transactionActivity = (summary?.recentTransactions || []).map((tx) => ({
      id: `tx-${tx._id}`,
      title: tx.productName,
      detail: `${txTypes[tx.type]?.label || tx.type} • Qty ${tx.quantity}`,
      timestamp: tx.createdAt,
      badge: txTypes[tx.type]?.label || tx.type,
      color: txTypes[tx.type]?.color || 'var(--accent)'
    }));

    const productActivity = recentProducts.map((product) => ({
      id: `product-${product._id}`,
      title: product.name,
      detail: `New product in ${product.category?.name || 'catalogue'}`,
      timestamp: product.createdAt,
      badge: 'Product',
      color: 'var(--accent)'
    }));

    const supplierActivity = recentSuppliers.map((supplier) => ({
      id: `supplier-${supplier._id}`,
      title: supplier.name,
      detail: `Supplier added in ${supplier.category || 'General'}`,
      timestamp: supplier.createdAt,
      badge: 'Supplier',
      color: 'var(--purple)'
    }));

    return [...transactionActivity, ...productActivity, ...supplierActivity]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);
  }, [recentProducts, recentSuppliers, summary]);

  return (
    <div>
      <Topbar title="Dashboard" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
      <div className="page-content">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard icon="□" label="Total Products" value={productCount} sub="In catalogue" color="var(--accent)" />
              <StatCard icon="⊞" label="Stock Items" value={summary?.totalProducts ?? 0} sub="Being tracked" color="var(--purple)" />
              <StatCard icon="⬢" label="Suppliers" value={supplierCount} sub={`${supplierStats?.active ?? 0} active vendors`} color="var(--green)" />
              <StatCard icon="⚠" label="Low Stock" value={lowStock.length} sub="Need restocking" color={lowStock.length > 0 ? 'var(--gold)' : 'var(--green)'} />
              <StatCard icon="✕" label="Out of Stock" value={summary?.outOfStock ?? 0} sub="Zero quantity" color={summary?.outOfStock > 0 ? 'var(--red)' : 'var(--green)'} />
              <StatCard icon="↔" label="Transactions" value={summary?.totalTransactions ?? 0} sub="All time" color="var(--text)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="card">
                <InteractiveBarChart title="Stock Health Status" data={stockHealthData} height={280} />
                <div className="helper-text" style={{ textAlign: 'center', marginTop: 10 }}>Hover over bars for a quick stock health breakdown.</div>
              </div>
              {transactionData.length > 0 && (
                <div className="card">
                  <InteractivePieChart title="Recent Transaction Mix" data={transactionData} height={280} />
                  <div className="helper-text" style={{ textAlign: 'center', marginTop: 10 }}>Recent movement types based on the latest inventory activity.</div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Low Stock Alerts</h3>
                  <Link to="/inventory?lowStock=true" style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>View all →</Link>
                </div>
                {lowStock.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <div className="empty-state-icon">✓</div>
                    <p>All stock levels are healthy.</p>
                  </div>
                ) : (
                  <div className="stack-list">
                    {lowStock.slice(0, 6).map((item) => (
                      <div key={item._id} className={`alert-list-item ${item.quantity === 0 ? 'alert-list-item-out' : item.quantity <= item.lowStockThreshold / 2 ? 'alert-list-item-critical' : ''}`}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.productName}</div>
                          <div className="table-subtext">{item.sku}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: item.quantity === 0 ? 'var(--red)' : 'var(--gold)' }}>{item.quantity}</div>
                          <div className="table-subtext">min {item.lowStockThreshold}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Activity Feed</h3>
                  <Link to="/transactions" style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>Open transactions →</Link>
                </div>
                {recentActivity.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <div className="empty-state-icon">↔</div>
                    <p>No activity yet.</p>
                  </div>
                ) : (
                  <div className="stack-list">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="activity-item">
                        <span className="activity-dot" style={{ background: item.color }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ fontWeight: 700 }}>{item.title}</div>
                            <span className="table-subtext">{formatRelativeTime(item.timestamp)}</span>
                          </div>
                          <div className="table-subtext">{item.detail}</div>
                        </div>
                        <span className="activity-badge">{item.badge}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="card">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Latest Products</h3>
                <div className="stack-list">
                  {recentProducts.slice(0, 5).map((product) => (
                    <div key={product._id} className="mini-row">
                      <div>
                        <div style={{ fontWeight: 700 }}>{product.name}</div>
                        <div className="table-subtext">{product.category?.name || 'Uncategorized'} • ₹{Number(product.price || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <span className={`badge ${product.imageUrl ? 'badge-green' : 'badge-purple'}`}>{product.imageUrl ? 'Image' : 'No Image'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Supplier Snapshot</h3>
                <div className="stack-list">
                  <div className="mini-row">
                    <span className="meta-label">Average Rating</span>
                    <strong style={{ color: 'var(--gold)' }}>{supplierStats?.averageRating ?? 0}</strong>
                  </div>
                  <div className="mini-row">
                    <span className="meta-label">Top Rated Vendors</span>
                    <strong style={{ color: 'var(--green)' }}>{supplierStats?.topRatedCount ?? 0}</strong>
                  </div>
                  {(supplierStats?.byCategory || []).slice(0, 3).map((item) => (
                    <div key={item._id} className="mini-row">
                      <span>{item._id}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/products" className="btn btn-secondary">Manage Products</Link>
                <Link to="/inventory" className="btn btn-secondary">View Inventory</Link>
                <Link to="/suppliers" className="btn btn-secondary">Manage Suppliers</Link>
                <Link to="/transactions" className="btn btn-secondary">View Transactions</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
