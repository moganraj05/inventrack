import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const roleBadgeClass = (role) => {
  if (role === 'admin') return 'badge-purple';
  if (role === 'manager') return 'badge-green';
  return 'badge-blue';
};

export default function UsersPage() {
  const { isAdmin, user: me } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleModal, setRoleModal] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return; }
    authAPI.getUsers()
      .then(r => setUsers(r.data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [isAdmin, navigate]);

  const handleRoleChange = async () => {
    setSaving(true);
    try {
      await authAPI.updateRole(roleModal._id, newRole);
      toast.success('Role updated');
      setUsers(u => u.map(x => x._id === roleModal._id ? { ...x, role: newRole } : x));
      setRoleModal(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <Topbar title="Users" subtitle="Manage system users" />
      <div className="page-content">
        <div className="page-header">
          <div><div className="page-title">Users</div><div className="page-subtitle">{users.length} registered users</div></div>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>User</th><th>Email</th><th>Role</th><th>Last Login</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar">{u.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name} {u._id === me?._id || u.id === me?.id ? <span style={{ fontSize: '0.7rem', color: 'var(--accent)', marginLeft: 4 }}>You</span> : null}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>ID: {u._id?.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: '0.875rem' }}>{u.email}</span></td>
                    <td><span className={`badge ${roleBadgeClass(u.role)}`}>{u.role}</span></td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}</span></td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setRoleModal(u); setNewRole(u.role); }}>Change Role</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title={`Change Role — ${roleModal?.name}`}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--text2)', marginBottom: 16, fontSize: '0.9rem' }}>Current role: <span className={`badge ${roleBadgeClass(roleModal?.role)}`}>{roleModal?.role}</span></p>
          <div className="form-group">
            <label className="form-label">New Role</label>
            <select className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setRoleModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleRoleChange} disabled={saving || newRole === roleModal?.role}>
            {saving ? 'Saving…' : 'Update Role'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
