import React, { useState, useEffect } from 'react';
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

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Interactive chart data
  const [stockHealthData, setStockHealthData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, lowRes, prodRes, supRes] = await Promise.allSettled([
          inventoryAPI.getSummary(),
          inventoryAPI.getLowStock(),
          productAPI.getAll({ limit: 1 }),
          supplierAPI.getAll({ limit: 1 })
        ]);

        if (sumRes.status === 'fulfilled') {
          setSummary(sumRes.value.data.summary);
          
          // Prepare transaction data for pie chart
          const txs = sumRes.value.data.summary?.recentTransactions || [];
          const typeCount = {};
          txs.forEach(tx => {
            typeCount[tx.type] = (typeCount[tx.type] || 0) + 1;
          });

          const txData = [
            { label: 'Stock In', value: typeCount.IN || 0, color: 'var(--green)' },
            { label: 'Stock Out', value: typeCount.OUT || 0, color: 'var(--red)' },
            { label: 'Adjusted', value: typeCount.ADJUSTMENT || 0, color: 'var(--yellow)' },
            { label: 'Returned', value: typeCount.RETURN || 0, color: 'var(--accent)' },
            { label: 'Damaged', value: typeCount.DAMAGED || 0, color: 'var(--purple)' }
          ].filter(t => t.value > 0);

          setTransactionData(txData);
        }

        if (lowRes.status === 'fulfilled') {
          const alerts = lowRes.value.data.alerts || [];
          setLowStock(alerts);
        }

        if (prodRes.status === 'fulfilled') {
          setProductCount(prodRes.value.data.pagination?.total || 0);
        }

        if (supRes.status === 'fulfilled') {
          setSupplierCount(supRes.value.data.pagination?.total || 0);
        }

        // Get all stocks for health data
        const allStockRes = await inventoryAPI.getAll({ limit: 1000 });
        const stocks = allStockRes.data.stocks || [];
        setAllStocks(stocks);

        const inStock = stocks.filter(s => s.quantity > s.lowStockThreshold).length;
        const lowStk = stocks.filter(s => s.quantity > 0 && s.quantity <= s.lowStockThreshold).length;
        const outStk = stocks.filter(s => s.quantity === 0).length;

        setStockHealthData([
          { label: 'In Stock', value: inStock, color: 'var(--green)' },
          { label: 'Low Stock', value: lowStk, color: 'var(--yellow)' },
          { label: 'Out of Stock', value: outStk, color: 'var(--red)' }
        ]);

      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const txTypes = { IN: { color: 'var(--green)', bg: 'var(--green-bg)', label: '↑ IN' }, OUT: { color: 'var(--red)', bg: 'var(--red-bg)', label: '↓ OUT' }, ADJUSTMENT: { color: 'var(--yellow)', bg: 'var(--yellow-bg)', label: '~ ADJ' }, RETURN: { color: 'var(--accent)', bg: 'var(--accent-glow)', label: '↩ RET' }, DAMAGED: { color: 'var(--purple)', bg: 'var(--purple-bg)', label: '✕ DMG' } };

  return (
    <div>
      <Topbar title="Dashboard" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
      <div className="page-content">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div className="stats-grid">
              <StatCard icon="⬡" label="Total Products" value={productCount} sub="In catalogue" color="var(--accent)" />
              <StatCard icon="⊞" label="Stock Items" value={summary?.totalProducts ?? 0} sub="Being tracked" color="var(--purple)" />
              <StatCard icon="⬢" label="Suppliers" value={supplierCount} sub="Active vendors" color="var(--green)" />
              <StatCard icon="⚠" label="Low Stock" value={lowStock.length} sub="Need restocking" color={lowStock.length > 0 ? 'var(--yellow)' : 'var(--green)'} />
              <StatCard icon="✕" label="Out of Stock" value={summary?.outOfStock ?? 0} sub="Zero quantity" color={summary?.outOfStock > 0 ? 'var(--red)' : 'var(--green)'} />
              <StatCard icon="⇄" label="Transactions" value={summary?.totalTransactions ?? 0} sub="All time" color="var(--text)" />
            </div>

            {/* Interactive Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Stock Health Interactive Bar Chart */}
              <div className="card">
                <InteractiveBarChart
                  title="📊 Stock Health Status"
                  data={stockHealthData}
                  height={280}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 10, textAlign: 'center' }}>
                  💡 Hover over bars for details
                </div>
              </div>

              {/* Transaction Types Interactive Pie Chart */}
              {transactionData.length > 0 && (
                <div className="card">
                  <InteractivePieChart
                    title="⇄ Transaction Distribution"
                    data={transactionData}
                    height={280}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 10, textAlign: 'center' }}>
                    💡 Hover on pie slices for details
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Low Stock Alerts */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>⚠ Low Stock Alerts</h3>
                  <Link to="/inventory?lowStock=true" style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>View all →</Link>
                </div>
                {lowStock.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '0.875rem' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>✓</div>
                    All stock levels healthy
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lowStock.slice(0, 6).map(item => (
                      <div key={item._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.productName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{item.sku}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: item.quantity === 0 ? 'var(--red)' : 'var(--yellow)' }}>{item.quantity}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>min {item.lowStockThreshold}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>⇄ Recent Transactions</h3>
                  <Link to="/transactions" style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>View all →</Link>
                </div>
                {(!summary?.recentTransactions || summary.recentTransactions.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '0.875rem' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⇄</div>
                    No transactions yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {summary.recentTransactions.map(tx => {
                      const t = txTypes[tx.type] || txTypes.IN;
                      return (
                        <div key={tx._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.productName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{new Date(tx.createdAt).toLocaleString()}</div>
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: ['IN', 'RETURN'].includes(tx.type) ? 'var(--green)' : 'var(--text)' }}>
                            {['IN', 'RETURN'].includes(tx.type) ? '+' : tx.type === 'ADJUSTMENT' ? '' : '-'}{tx.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/products" className="btn btn-secondary">⬡ Manage Products</Link>
                <Link to="/inventory" className="btn btn-secondary">⊞ View Inventory</Link>
                <Link to="/suppliers" className="btn btn-secondary">⬢ Manage Suppliers</Link>
                <Link to="/transactions" className="btn btn-secondary">⇄ View Transactions</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
