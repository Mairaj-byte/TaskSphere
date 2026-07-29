import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import {
  Plus, Search, Filter, RefreshCw, Edit2, Trash2, Calendar, AlertCircle,
  LayoutGrid, List, X, Paperclip, CheckCircle2,
  KanbanSquare, CalendarDays, GanttChartSquare, Mic
} from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import GanttChart from '../components/GanttChart';
import VoiceTaskModal from '../components/VoiceTaskModal';
import { useSocket } from "../context/SocketContext";

const Tasks = () => {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Tasks & View State
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
 const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'kanban' | 'calendar' | 'gantt'

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('dueDate:asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentTaskId, setCurrentTaskId] = useState(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formStatus, setFormStatus] = useState('To Do');
  const [formStartDate, setFormStartDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formEstimatedHours, setFormEstimatedHours] = useState(0);
  const [formAssignedTo, setFormAssignedTo] = useState([]);
  const [formAttachment, setFormAttachment] = useState('');
  const [formAttachmentsList, setFormAttachmentsList] = useState([]);
  const [formTags, setFormTags] = useState([]);
  const [formTagInput, setFormTagInput] = useState('');
  const [formChecklist, setFormChecklist] = useState([]);
  const [formChecklistInput, setFormChecklistInput] = useState('');
  const [formDependencies, setFormDependencies] = useState([]);
  const [formError, setFormError] = useState('');

  // Confirm Delete State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  // Lightweight built-in toast (no external dependency required)
  const [toastMsg, setToastMsg] = useState(null);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
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

      const taskList = Array.isArray(data) ? data : [];
      setTasks(taskList);
      setAllTasks(taskList);
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
      setUsersList(Array.isArray(data) ? data.filter(u => u.active) : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, priorityFilter, dateFilter, sortBy]);

  useEffect(() => {
    // FIX: previous condition was `user && user.role === 'admin' || 'manager'`
    // which always evaluated truthy due to operator precedence.
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      fetchUsers();
    }
  }, [user]);



  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormPriority('Medium');
    setFormStatus('To Do');
    setFormStartDate('');
    setFormDueDate('');
    setFormEstimatedHours(0);
    setFormAssignedTo([]);
    setFormAttachment('');
    setFormAttachmentsList([]);
    setFormTags([]);
    setFormTagInput('');
    setFormChecklist([]);
    setFormChecklistInput('');
    setFormDependencies([]);
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Called by VoiceTaskModal once the transcript has been parsed on the backend.
  // Pre-fills the normal create-task form so the person can review/edit
  // before actually submitting — matches the "confirm before it's pushed" flow.
  const handleVoiceParsed = (parsed) => {
    resetForm();
    setModalMode('create');
    setFormTitle(parsed.title || '');
    setFormPriority(parsed.priority || 'Medium');
    if (parsed.dueDate) {
      setFormDueDate(new Date(parsed.dueDate).toISOString().slice(0, 16));
    }
    if (parsed.assignedTo?.length) {
      setFormAssignedTo(parsed.assignedTo);
    }
    setIsVoiceModalOpen(false);
    setIsModalOpen(true);
    if (parsed.warnings?.length) {
      setToastMsg(parsed.warnings[0]);
    }
  };

  const openEditModal = (task, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setCurrentTaskId(task._id);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);

    if (task.startDate) {
      setFormStartDate(new Date(task.startDate).toISOString().slice(0, 16));
    } else {
      setFormStartDate('');
    }

    setFormEstimatedHours(task.estimatedHours || 0);
    setFormTags(task.tags || []);
    setFormChecklist(task.checklist || []);
    setFormDependencies(task.dependencies || []);

    const formattedDate = new Date(task.dueDate).toISOString().slice(0, 16);
    setFormDueDate(formattedDate);
    setFormAssignedTo(task.assignedTo.map(u => u._id));
    setFormAttachmentsList(task.attachments || []);
    setFormAttachment('');
    setFormError('');
    setIsModalOpen(true);
  };

  const addChecklistItem = () => {
    if (!formChecklistInput.trim()) return;
    setFormChecklist(prev => [...prev, { title: formChecklistInput.trim(), completed: false }]);
    setFormChecklistInput('');
  };

  const toggleChecklistItem = (index) => {
    setFormChecklist(prev =>
      prev.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
    );
  };

  const removeChecklistItem = (index) => {
    setFormChecklist(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (!formTagInput.trim()) return;
    setFormTags(prev => [...prev, formTagInput.trim()]);
    setFormTagInput('');
  };

  const handleRemoveTag = (index) => {
    setFormTags(prev => prev.filter((_, i) => i !== index));
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
      status: formStatus,
      startDate: formStartDate ? new Date(formStartDate).toISOString() : null,
      dueDate: new Date(formDueDate).toISOString(),
      estimatedHours: Number(formEstimatedHours),
      assignedTo: formAssignedTo,
      attachments: formAttachmentsList,
      tags: formTags,
      checklist: formChecklist,
      dependencies: formDependencies
    };

    try {
      const url = modalMode === 'create' ? `${API_BASE}/tasks` : `${API_BASE}/tasks/${currentTaskId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        await fetchTasks();
        setIsModalOpen(false);
        fetchTasks();
        setToastMsg(modalMode === 'create' ? 'Task created successfully!' : 'Task updated successfully!');
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
    const statusMap = {
      'To Do': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      'In Progress': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800',
      'In Review': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800',
      'Blocked': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800',
      'Completed (Pending Approval)': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
      'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
      'Rejected': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800',
      'Overdue': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
    };

    const colorClass = statusMap[status] || 'bg-slate-100 text-slate-700 border-slate-300';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      Low: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      Medium: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      High: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
      Urgent: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${priorityMap[priority] || ''}`}>
        {priority} Priority
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Inline toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg text-sm">
          <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Workflow Tasks</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and track tasks across team members.
          </p>
        </div>
        {['admin', 'manager'].includes(user?.role) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Mic size={18} />
              <span>Voice Task</span>
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Plus size={18} />
              <span>Create Task</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and View Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by task title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* View Switcher Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List size={16} />
              <span className="hidden sm:inline">List</span>
            </button>
           <button
  onClick={() => setViewMode('kanban')}
  className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
    viewMode === 'kanban'
      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
  }`}
  title="Kanban Board"
>
  <KanbanSquare size={16} />
  <span className="hidden sm:inline">Kanban</span>
</button>
<button
  onClick={() => setViewMode('calendar')}
  className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
    viewMode === 'calendar'
      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
  }`}
  title="Calendar View"
>
  <CalendarDays size={16} />
  <span className="hidden sm:inline">Calendar</span>
</button>
<button
  onClick={() => setViewMode('gantt')}
  className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
    viewMode === 'gantt'
      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
  }`}
  title="Gantt / Timeline View"
>
  <GanttChartSquare size={16} />
  <span className="hidden sm:inline">Gantt</span>
</button>
          
          </div>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed (Pending Approval)">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="">All Dates</option>
              <option value="today">Due Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="dueDate:asc">Due Date: Soonest</option>
              <option value="dueDate:desc">Due Date: Farthest</option>
              <option value="priority:desc">Priority: High to Low</option>
              <option value="createdAt:desc">Created Date: Newest</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
              setDateFilter('');
              setSortBy('dueDate:asc');
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-auto"
            title="Reset Filters"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Task Content */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <AlertCircle size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Tasks Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search criteria or clear filters.
          </p>
        </div>
     ) : viewMode === 'kanban' ? (
  <KanbanBoard
    tasks={tasks}
    user={user}
    token={token}
    navigate={navigate}
    showToast={setToastMsg}
    refreshTasks={fetchTasks}
  />
) : viewMode === 'calendar' ? (
  <CalendarView tasks={tasks} navigate={navigate} />
) : viewMode === 'gantt' ? (
  <GanttChart tasks={tasks} navigate={navigate} />
) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const daysLeft = Math.round((new Date(task.dueDate) - new Date()) / (24 * 60 * 60 * 1000));
            const isOverdue = task.status === 'Overdue' || (daysLeft < 0 && task.status !== 'Approved');

            return (
              <div
                key={task._id}
                onClick={() => navigate(`/tasks/${task._id}`)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {task.title}
                    </h3>
                    {['admin', 'manager'].includes(user?.role) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => openEditModal(task, e)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Task"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => confirmDelete(task._id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>

                  {task.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {task.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {task.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                  <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Calendar size={14} />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex -space-x-1.5 overflow-hidden">
                    {task.assignedTo.map((u) => (
                      <div
                        key={u._id}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold border-2 border-white dark:border-slate-900"
                        title={`${u.name} (${u.email})`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Task</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Assignees</th>
                  {['admin', 'manager'].includes(user?.role) && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                {tasks.map((task) => (
                  <tr
                    key={task._id}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getPriorityBadge(task.priority)}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {task.assignedTo.map((u) => (
                          <div
                            key={u._id}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold border-2 border-white dark:border-slate-900"
                            title={u.name}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </td>
                    {['admin', 'manager'].includes(user?.role) && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => openEditModal(task, e)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => confirmDelete(task._id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-4xl lg:max-w-5xl w-full p-6 shadow-xl my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {modalMode === 'create' ? 'Create New Task' : 'Edit Task Details'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} className="mt-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Core Task Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g., Update Landing Page Header"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Provide scope, targets, and notes..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Priority
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Status
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="In Review">In Review</option>
                        <option value="Blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Due Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={formEstimatedHours}
                      onChange={(e) => setFormEstimatedHours(e.target.value)}
                    />
                  </div>
                </div>

                {/* Right Column: People & Attachments */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assign Team Members *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/20">
                      {usersList.map((member) => {
                        const isSelected = formAssignedTo.includes(member._id);
                        return (
                          <div
                            key={member._id}
                            onClick={() => toggleAssignee(member._id)}
                            className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold truncate">{member.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Attachments (URLs)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                        placeholder="https://..."
                        value={formAttachment}
                        onChange={(e) => setFormAttachment(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleAddAttachment}
                        className="px-3 py-2 text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {formAttachmentsList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto">
                        {formAttachmentsList.map((url, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                          >
                            <Paperclip size={12} />
                            <span className="max-w-[150px] truncate">{url}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(index)}
                              className="hover:text-rose-500 font-bold ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tags
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formTagInput}
                        placeholder="e.g., frontend"
                        onChange={(e) => setFormTagInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-2 text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {formTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formTags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-xs"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(index)}
                              className="hover:text-rose-500 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Full-width extras: Checklist + Dependencies */}
              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subtasks / Checklist
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formChecklistInput}
                      onChange={(e) => setFormChecklistInput(e.target.value)}
                      placeholder="e.g., Write unit tests"
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      className="px-3 py-2 text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {formChecklist.length > 0 && (
                    <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                      {formChecklist.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleChecklistItem(index)}
                            />
                            <span className={item.completed ? 'line-through text-slate-400' : ''}>
                              {item.title}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(index)}
                            className="text-rose-500 hover:text-rose-600 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Task Dependencies (must be completed first)
                  </label>
                  <select
                    multiple
                    value={formDependencies}
                    onChange={(e) => {
                      const values = [...e.target.selectedOptions].map(option => option.value);
                      setFormDependencies(values);
                    }}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-indigo-500 max-h-32"
                  >
                    {allTasks
                      .filter(task => task._id !== currentTaskId)
                      .map(task => (
                        <option key={task._id} value={task._id}>
                          {task.title}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hold Ctrl (Cmd on Mac) to select multiple tasks.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  {modalMode === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Task</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to permanently delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      <VoiceTaskModal
        open={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        token={token}
        onParsed={handleVoiceParsed}
      />
    </div>
  );
};

export default Tasks;