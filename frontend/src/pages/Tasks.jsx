import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  Plus, Search, Filter, RefreshCw, Edit2, Trash2, Calendar, AlertCircle 
} from 'lucide-react';

const Tasks = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('dueDate:asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentTaskId, setCurrentTaskId] = useState(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState([]);
  const [formAttachment, setFormAttachment] = useState('');
  const [formAttachmentsList, setFormAttachmentsList] = useState([]);
  
  const [formError, setFormError] = useState('');

  // Confirm Delete State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (dateFilter) params.append('dueDate', dateFilter);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await fetch(`${API_BASE}/tasks?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      // Keep only active users
      setUsersList(Array.isArray(data) ? data.filter(u => u.active) : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, statusFilter, priorityFilter, dateFilter, sortBy]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormPriority('Medium');
    setFormDueDate('');
    setFormAssignedTo([]);
    setFormAttachment('');
    setFormAttachmentsList([]);
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = (task, e) => {
    e.stopPropagation(); // prevent card click navigation
    setModalMode('edit');
    setCurrentTaskId(task._id);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormPriority(task.priority);
    // Format date string for input element (YYYY-MM-DDThh:mm)
    const formattedDate = new Date(task.dueDate).toISOString().slice(0, 16);
    setFormDueDate(formattedDate);
    setFormAssignedTo(task.assignedTo.map(u => u._id));
    setFormAttachmentsList(task.attachments || []);
    setFormAttachment('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddAttachment = () => {
    if (formAttachment && formAttachment.trim()) {
      setFormAttachmentsList(prev => [...prev, formAttachment.trim()]);
      setFormAttachment('');
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormAttachmentsList(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAssignee = (userId) => {
    setFormAssignedTo(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) return setFormError('Title is required');
    if (!formDueDate) return setFormError('Due date is required');
    if (formAssignedTo.length === 0) return setFormError('Please assign at least one team member');

    const payload = {
      title: formTitle.trim(),
      description: formDesc.trim(),
      priority: formPriority,
      dueDate: new Date(formDueDate).toISOString(),
      assignedTo: formAssignedTo,
      attachments: formAttachmentsList
    };

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch(`${API_BASE}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/tasks/${currentTaskId}`, {
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
        fetchTasks();
      } else {
        setFormError(data.error || 'Operation failed');
      }
    } catch (err) {
      setFormError('Network error. Failed to save task.');
    }
  };

  const confirmDelete = (taskId, e) => {
    e.stopPropagation();
    setDeleteTaskId(taskId);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteTask = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${deleteTaskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIsDeleteConfirmOpen(false);
        fetchTasks();
      } else {
        alert('Failed to delete task.');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const getStatusBadge = (status) => {
    const slug = status.toLowerCase().replace(/ \(.+\)/g, '').replace(' ', '-');
    return <span className={`badge badge-${slug}`}>{status}</span>;
  };

  return (
    <div className="tasks-page">
      <div className="page-header-row">
        <div>
          <h2>Workflow Tasks</h2>
          <p className="welcome-text">Search, filter, and track tasks across team members.</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={18} />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar glass-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by task title or description..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-item">
            <Filter size={14} className="filter-icon" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed (Pending Approval)">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="filter-item">
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="filter-item">
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="">All Dates</option>
              <option value="today">Due Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>

          <div className="filter-item">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="dueDate:asc">Due Date: Soonest</option>
              <option value="dueDate:desc">Due Date: Farthest</option>
              <option value="priority:desc">Priority: High to Low</option>
              <option value="createdAt:desc">Created Date: Newest</option>
            </select>
          </div>

          <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setDateFilter(''); setSortBy('dueDate:asc'); }} className="btn-refresh" title="Reset Filters">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Task Listing */}
      {loading ? (
        <div className="loading-container"><div className="loading-spinner"></div></div>
      ) : tasks.length === 0 ? (
        <div className="empty-tasks glass-card">
          <AlertCircle size={40} className="empty-icon" />
          <h3>No Tasks Found</h3>
          <p>Try modifying your search filter query.</p>
        </div>
      ) : (
        <div className="task-cards-list">
          {tasks.map(task => {
            const daysLeft = Math.round((new Date(task.dueDate) - new Date()) / (24 * 60 * 60 * 1000));
            let dateAlertClass = '';
            if (task.status !== 'Approved' && task.status !== 'Completed (Pending Approval)') {
              if (task.status === 'Overdue') dateAlertClass = 'text-overdue';
              else if (daysLeft === 0) dateAlertClass = 'text-pending';
            }

            return (
              <div 
                key={task._id} 
                className="task-card glass-card"
                onClick={() => navigate(`/tasks/${task._id}`)}
              >
                <div className="task-card-header">
                  <div className="title-section">
                    <p className="task-card-title">{task.title}</p>
                    <div className="badges-row">
                      {getStatusBadge(task.status)}
                      <span className={`badge badge-${task.priority.toLowerCase()}`}>
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                  {user.role === 'admin' && (
                    <div className="action-buttons-group">
                      <button 
                        onClick={(e) => openEditModal(task, e)} 
                        className="btn-card-action edit"
                        title="Edit Task"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => confirmDelete(task._id, e)} 
                        className="btn-card-action delete"
                        title="Delete Task"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="task-card-desc">{task.description || 'No description provided.'}</p>

                <div className="task-card-footer">
                  <div className={`date-field ${dateAlertClass}`}>
                    <Calendar size={12} />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>

                  <div className="task-assignees">
                    {task.assignedTo.map(u => (
                      <span 
                        key={u._id} 
                        className="assignee-avatar" 
                        title={`${u.name} (${u.email})`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TASK CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Create New Task' : 'Edit Task Details'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            {formError && (
              <div className="form-error-msg">
                <AlertCircle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="task-form">
              <div className="form-group">
                <label>Task Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Task title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-textarea"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Provide details about the task workload..."
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    className="form-select"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="form-input"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assign Team Members (Select multiple) *</label>
                <div className="assignees-picker-grid">
                  {usersList.map(member => (
                    <div 
                      key={member._id}
                      className={`assignee-picker-card ${formAssignedTo.includes(member._id) ? 'selected' : ''}`}
                      onClick={() => toggleAssignee(member._id)}
                    >
                      <div className="picker-avatar">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="picker-info">
                        <p className="picker-name">{member.name}</p>
                        <p className="picker-email">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="form-group">
                <label>Attachments (URLs)</label>
                <div className="attachment-input-row">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="https://company.sharepoint.com/docs/file.pdf"
                    value={formAttachment}
                    onChange={(e) => setFormAttachment(e.target.value)}
                  />
                  <button type="button" onClick={handleAddAttachment} className="btn btn-secondary">Add</button>
                </div>

                {formAttachmentsList.length > 0 && (
                  <div className="modal-attachments-list">
                    {formAttachmentsList.map((url, index) => (
                      <div key={index} className="attachment-tag">
                        <span className="attachment-url" title={url}>{url.substring(0, 30)}...</span>
                        <button type="button" onClick={() => handleRemoveAttachment(index)} className="btn-remove-tag">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modalMode === 'create' ? 'Create Task' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {isDeleteConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card dialog-confirm">
            <h3>Confirm Delete Task</h3>
            <p>Are you sure you want to permanently delete this task? This action will purge all comments and history records, and cannot be undone.</p>
            <div className="modal-footer-actions">
              <button className="btn btn-secondary" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteTask}>Delete Task</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .page-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .filter-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.25rem;
          margin-bottom: 2rem;
        }

        .search-box {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          background: var(--bg-input);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          color: var(--text-main);
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          outline: none;
          font-family: inherit;
          transition: border-color var(--transition-fast);
        }

        .search-box input:focus {
          border-color: var(--color-primary);
        }

        .filters-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-input);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 0.5rem 0.75rem;
        }

        .filter-icon {
          color: var(--text-muted);
        }

        .filter-item select {
          background: none;
          border: none;
          color: var(--text-main);
          font-family: inherit;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
        }

        .btn-refresh {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          width: 34px;
          height: 34px;
          border-radius: var(--border-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-refresh:hover {
          color: var(--text-main);
          border-color: var(--color-primary);
        }

        .empty-tasks {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          color: var(--text-muted);
          gap: 1rem;
        }

        .empty-icon {
          opacity: 0.3;
          color: var(--color-primary);
        }

        .title-section {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .badges-row {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .action-buttons-group {
          display: flex;
          gap: 0.4rem;
        }

        .btn-card-action {
          width: 26px;
          height: 26px;
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.03);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-card-action.edit:hover {
          color: var(--color-primary);
          border-color: var(--color-primary);
          background: rgba(99, 102, 241, 0.1);
        }

        .btn-card-action.delete:hover {
          color: var(--color-rejected);
          border-color: var(--color-rejected);
          background: rgba(239, 68, 68, 0.1);
        }

        .date-field {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .assignees-picker-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          max-height: 180px;
          overflow-y: auto;
          padding: 0.25rem;
        }

        @media (max-width: 576px) {
          .assignees-picker-grid {
            grid-template-columns: 1fr;
          }
        }

        .assignee-picker-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          background: rgba(255,255,255,0.02);
          transition: all var(--transition-fast);
        }

        .assignee-picker-card:hover {
          border-color: rgba(255,255,255,0.15);
        }

        .assignee-picker-card.selected {
          border-color: var(--color-primary);
          background: rgba(99, 102, 241, 0.15);
        }

        .picker-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .assignee-picker-card.selected .picker-avatar {
          background: var(--color-primary);
          color: #fff;
        }

        .picker-name {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .picker-email {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .attachment-input-row {
          display: flex;
          gap: 0.5rem;
        }

        .attachment-input-row input {
          flex: 1;
        }

        .modal-attachments-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .attachment-tag {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-glass);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .btn-remove-tag {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-weight: 700;
        }

        .btn-remove-tag:hover {
          color: var(--color-rejected);
        }

        .form-error-msg {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-rejected);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 0.75rem;
          border-radius: var(--border-radius-sm);
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .modal-footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 2rem;
          border-top: 1px solid var(--border-glass);
          padding-top: 1.25rem;
        }

        .dialog-confirm {
          max-width: 450px;
          text-align: center;
        }

        .dialog-confirm p {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: 1rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default Tasks;
