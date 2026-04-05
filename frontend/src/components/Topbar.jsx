import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{subtitle}</div>}
        </div>
      </div>
      <div className="topbar-right">
        <div className="user-chip">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{user?.email}</span>
        </div>
      </div>
    </div>
  );
}
