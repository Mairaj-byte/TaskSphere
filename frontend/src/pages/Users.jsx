import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { Plus, Edit2, ShieldAlert, UserPlus, Shield, User, Power, AlertCircle } from 'lucide-react';

const Users = () => {
  const { user, token } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentUserId, setCurrentUserId] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('member');
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('member');
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = (targetUser) => {
    resetForm();
    setModalMode('edit');
    setCurrentUserId(targetUser._id);
    setFormName(targetUser.name);
    setFormEmail(targetUser.email);
    setFormRole(targetUser.role);
    setFormPassword(''); // blank for optional change
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) return setFormError('Name is required');
    if (!formEmail.trim()) return setFormError('Email is required');
    if (modalMode === 'create' && !formPassword) return setFormError('Password is required');

    const payload = {
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole
    };

    if (formPassword) {
      payload.password = formPassword;
    }

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/users/${currentUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setFormError(data.error || 'Operation failed.');
      }
    } catch (err) {
      setFormError('Network error. Failed to save user.');
    }
  };

  const handleToggleActive = async (targetUser) => {
    if (targetUser._id === user._id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${targetUser._id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to toggle account status.');
      }
    } catch (err) {
      console.error('Toggle status error', err);
    }
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="error-container glass-card">
        <ShieldAlert size={48} className="icon-overdue" />
        <h3>Access Denied</h3>
        <p>This workspace page is reserved for administrators/managers only.</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header-row">
        <div>
          <h2>Manage Team Accounts</h2>
          <p className="welcome-text">Create, configure, and deactivate team member profiles.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Add Member</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner"></div></div>
      ) : (
        <div className="users-table-container glass-card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className={!u.active ? 'row-deactivated' : ''}>
                  <td>
                    <div className="user-info-cell">
                      <div className="cell-avatar">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="cell-name">{u.name} {u._id === user._id && <span className="current-user-tag">(You)</span>}</p>
                        <p className="cell-email">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="role-cell-value">
                      {u.role === 'admin' ? (
                        <>
                          <Shield size={14} className="icon-success" />
                          <span>Manager</span>
                        </>
                      ) : (
                        <>
                          <User size={14} className="icon-primary" />
                          <span>Team Member</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'badge-approved' : 'badge-rejected'}`}>
                      {u.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <div className="actions-cell-row">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="btn-card-action edit"
                        title="Edit Account"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleToggleActive(u)}
                        className={`btn-card-action toggle ${u.active ? 'active-state' : 'inactive-state'}`}
                        title={u.active ? 'Deactivate Account' : 'Activate Account'}
                        disabled={u._id === user._id}
                      >
                        <Power size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* USER CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Team Member' : 'Edit Member Profile'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            {formError && (
              <div className="form-error-msg">
                <AlertCircle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="user-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex. Sarah Connor"
                  required
                />
              </div>

              <div className="form-group">
                <label>Work Email *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>{modalMode === 'create' ? 'Password *' : 'Password (leave blank to keep unchanged)'}</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={modalMode === 'create' ? '••••••••' : 'Optional password reset'}
                  required={modalMode === 'create'}
                />
              </div>

              <div className="form-group">
                <label>System Role</label>
                <select 
                  className="form-select"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  <option value="member">Team Member</option>
                  <option value="admin">Manager (Admin)</option>
                </select>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modalMode === 'create' ? 'Create Account' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .users-table-container {
          overflow-x: auto;
          margin-bottom: 2rem;
          background: rgba(13, 20, 38, 0.7);
          border: 1px solid var(--border-glass);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .users-table th {
          padding: 1rem 1.5rem;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-glass);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .users-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-glass);
          font-size: 0.9rem;
          vertical-align: middle;
        }

        .users-table tbody tr {
          transition: background-color var(--transition-fast);
        }

        .users-table tbody tr:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }

        .row-deactivated {
          opacity: 0.6;
        }

        .user-info-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cell-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .cell-name {
          font-weight: 600;
          color: var(--text-main);
        }

        .cell-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }

        .current-user-tag {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--color-approved);
          background: rgba(16, 185, 129, 0.1);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          margin-left: 0.25rem;
        }

        .role-cell-value {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
        }

        .date-cell {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .actions-cell-row {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .btn-card-action.toggle.active-state {
          color: var(--color-approved);
        }
        
        .btn-card-action.toggle.inactive-state {
          color: var(--color-rejected);
          background: rgba(239, 68, 68, 0.1);
        }

        .btn-card-action.toggle:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Users;
