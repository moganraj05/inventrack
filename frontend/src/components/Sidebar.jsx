import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/products', icon: '⬡', label: 'Products' },
  { to: '/inventory', icon: '⊞', label: 'Inventory' },
  { to: '/suppliers', icon: '⬢', label: 'Suppliers' },
  { to: '/transactions', icon: '⇄', label: 'Transactions' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)', background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      position: 'fixed', top: 0, left: 0, height: '100vh',
      display: 'flex', flexDirection: 'column', zIndex: 200, padding: '0'
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
          ▣ InvenTrack
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Inventory System
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 'var(--radius)', fontSize: '0.875rem', fontWeight: 500,
            color: isActive ? '#fff' : 'var(--text2)',
            background: isActive ? 'var(--accent)' : 'transparent',
            transition: 'var(--transition)',
            textDecoration: 'none'
          })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--bg3)'; }}
            onMouseLeave={e => { if (!e.currentTarget.style.background.includes('var(--accent)')) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '1rem', opacity: 0.9 }}>{icon}</span>
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink to="/users" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 'var(--radius)', fontSize: '0.875rem', fontWeight: 500,
            color: isActive ? '#fff' : 'var(--text2)',
            background: isActive ? 'var(--accent)' : 'transparent',
            transition: 'var(--transition)', textDecoration: 'none'
          })}>
            <span style={{ fontSize: '1rem', opacity: 0.9 }}>⊙</span>
            Users
          </NavLink>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--bg3)', border: '1px solid var(--border)', marginBottom: 8 }}>
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: '0.7rem', color: isAdmin ? 'var(--accent)' : 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--red)' || (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}>
          ⏻ Logout
        </button>
      </div>
    </aside>
  );
}
