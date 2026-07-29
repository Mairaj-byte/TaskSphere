import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast'; 

const Users = () => {
  const { user, token } = useAuth();
  const fileInputRef = useRef(null); // Ref for file input


  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false); // New loading state for import

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


  

// --- CSV IMPORT LOGIC ---
const handleCsvUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setImporting(true);
  const formData = new FormData();
  formData.append('csvFile', file);

  try {
    const res = await fetch(`${API_BASE}/users/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    
    if (res.ok) {
      // ✅ SUCCESS TOAST
      toast.success(data.message || 'Import successful!');
      fetchUsers(); // Refresh list
    } else {
      // ✅ ERROR TOAST
      toast.error(data.error || 'Import failed.');
    }
  } catch (err) {
    // ✅ ERROR TOAST
    toast.error('Network error during import.');
  } finally {
    setImporting(false);
    e.target.value = ''; // Reset input
  }
};

  
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECT LOGIC
  useEffect(() => {
    if (user && ['admin', 'manager'].includes(user.role)) {
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
    setFormRole(targetUser.role || 'member');
    setFormPassword(''); // blank for optional change
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and Email are required.');
      return;
    }
    if (modalMode === 'create' && !formPassword) {
      toast.error('Password is required for new users.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole
    };
    if (formPassword) payload.password = formPassword;

    try {
      const url = modalMode === 'create' 
        ? `${API_BASE}/users` 
        : `${API_BASE}/users/${currentUserId}`;
        
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(modalMode === 'create' ? 'User created successfully!' : 'User updated successfully!');
        setIsModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Operation failed.');
      }
    } catch (err) {
      toast.error('Network error. Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (targetUser) => {
    if (targetUser._id === user._id) {
      toast.error('You cannot deactivate your own account.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${targetUser._id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Status updated successfully.');
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to toggle account status.');
      }
    } catch (err) {
      toast.error('Network error during update.');
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
          This management portal is reserved exclusively for system administrators.
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
            Create, configure roles, and manage account statuses.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCsvUpload} 
            accept=".csv" 
            className="hidden" 
          />
          
          {/* Import Button */}
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={importing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-all duration-200 disabled:opacity-50"
          >
            {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
          </button>

          {/* Add Member Button */}
          <button 
            onClick={openCreateModal} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            <UserPlus size={18} />
            <span>Add Member</span>
          </button>
        </div>
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <ShieldAlert size={14} />
                            <span>Admin</span>
                          </span>
                        ) : u.role === 'manager' ? (
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${u.active
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
                          className={`p-2 rounded-lg transition-colors ${u._id === user._id
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
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
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