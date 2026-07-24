import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  Plus, 
  Edit2, 
  ShieldAlert, 
  UserPlus, 
  Shield, 
  User, 
  Power, 
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);

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
    } finally {
      setSubmitting(false);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-md max-w-lg mx-auto shadow-xl">
        <div className="p-4 bg-red-500/10 rounded-full mb-4 text-red-400">
          <ShieldAlert size={48} />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Access Denied</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          This workspace page is reserved for administrators and managers only.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Manage Team Accounts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, configure, and deactivate team member profiles.
          </p>
        </div>
        <button 
          onClick={openCreateModal} 
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <UserPlus size={18} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th scope="col" className="px-6 py-4">Name / Email</th>
                  <th scope="col" className="px-6 py-4">Role</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Joined</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map(u => (
                  <tr 
                    key={u._id} 
                    className={`transition-colors hover:bg-slate-800/30 ${!u.active ? 'opacity-60 bg-slate-950/20' : ''}`}
                  >
                    {/* User Profile Cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-semibold text-sm flex items-center justify-center shadow-md">
                          {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            <span>{u.name}</span>
                            {u._id === user._id && (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-normal">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role Cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Shield size={14} />
                            <span>Manager</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            <User size={14} />
                            <span>Team Member</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        u.active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Joined Date Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>

                    {/* Actions Cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                          title="Edit Account"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(u)}
                          disabled={u._id === user._id}
                          className={`p-2 rounded-lg transition-colors ${
                            u._id === user._id 
                              ? 'opacity-30 cursor-not-allowed text-slate-600' 
                              : u.active 
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' 
                                : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                          title={u.active ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-100">
                {modalMode === 'create' ? 'Add New Team Member' : 'Edit Member Profile'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Full Name *</label>
                <input 
                  type="text" 
                  className="w-full px-3.5 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex. Sarah Connor"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Work Email *</label>
                <input 
                  type="email" 
                  className="w-full px-3.5 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" 
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  {modalMode === 'create' ? 'Password *' : 'Password (leave blank to keep unchanged)'}
                </label>
                <input 
                  type="password" 
                  className="w-full px-3.5 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600" 
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={modalMode === 'create' ? '••••••••' : 'Optional password reset'}
                  required={modalMode === 'create'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">System Role</label>
                <select 
                  className="w-full px-3.5 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  <option value="member">Team Member</option>
                  <option value="admin">Manager (Admin)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Account' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;