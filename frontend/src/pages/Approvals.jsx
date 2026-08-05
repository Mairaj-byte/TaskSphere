import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Inbox,
  Clock3,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';

// Status string used by the backend for tasks a member has submitted
// and that are now awaiting admin/manager sign-off (see Task model).
const PENDING_STATUS = 'Completed (Pending Approval)';

const priorityStyles = {
  Urgent: 'bg-red-500/20 text-red-300 border-red-500/30',
  High: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const Approvals = () => {
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-task UI state, keyed by task id, so one card's action never
  // affects another card while requests are in flight.
  const [actioningId, setActioningId] = useState(null);
  const [rejectDraftId, setRejectDraftId] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  const fetchPending = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      const res = await fetch(
        `${API_BASE}/tasks?status=${encodeURIComponent(PENDING_STATUS)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        throw new Error('Failed to load approvals.');
      }

      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchPending error:', err);
      setError('Could not load pending approvals. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    fetchPending();
  }, [fetchPending]);

  // Keep the list live: any task status change anywhere in the app
  // (member submits, another admin approves, etc.) should update this
  // list without requiring a manual refresh.
  useEffect(() => {
    if (!socket) return;
    socket.on('taskUpdated', fetchPending);
    return () => {
      socket.off('taskUpdated', fetchPending);
    };
  }, [socket, fetchPending]);

  const updateStatus = async (taskId, status, feedback) => {
    setActioningId(taskId);
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, feedback }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Action failed.');
      }

      // Optimistically drop it from the list — the socket refresh will
      // reconcile shortly after, but this makes the click feel instant.
      setTasks((prev) => prev.filter((t) => t._id !== taskId));

      toast.success(
        status === 'Approved' ? 'Task approved.' : 'Task rejected.'
      );

      setRejectDraftId(null);
      setRejectFeedback('');
    } catch (err) {
      console.error('updateStatus error:', err);
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const handleApprove = (taskId) => {
    if (actioningId) return;
    updateStatus(taskId, 'Approved', '');
  };

  const handleRejectSubmit = (taskId) => {
    if (!rejectFeedback.trim()) {
      toast.error('Please add feedback before rejecting.');
      return;
    }
    updateStatus(taskId, 'Rejected', rejectFeedback.trim());
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center p-10 text-gray-400">
        You don't have permission to view this page.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Approvals</h1>
            <p className="text-sm text-gray-400">
              Tasks submitted by your team, waiting for a decision.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            {tasks.length} pending
          </span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchPending();
            }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          Loading approvals...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <Inbox size={32} className="text-gray-500" />
          <p className="text-sm font-semibold text-white">All caught up</p>
          <p className="text-xs text-gray-400">
            No tasks are waiting for approval right now.
          </p>
        </div>
      )}

      {/* Pending task cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {tasks.map((task) => {
          const isBusy = actioningId === task._id;
          const isRejecting = rejectDraftId === task._id;

          return (
            <div
              key={task._id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    className="group flex items-center gap-1.5 text-left"
                  >
                    <h3 className="truncate text-base font-semibold text-white group-hover:text-indigo-300">
                      {task.title}
                    </h3>
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-gray-500 group-hover:text-indigo-300"
                    />
                  </button>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                      {task.description}
                    </p>
                  )}
                </div>

                {task.priority && (
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      priorityStyles[task.priority] ||
                      'bg-white/10 text-gray-300 border-white/20'
                    }`}
                  >
                    {task.priority}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                <span>
                  {task.group?.name ? `Project: ${task.group.name}` : 'No project'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock3 size={12} />
                  Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                </span>
                {task.assignedTo?.length > 0 && (
                  <span>
                    By {task.assignedTo.map((u) => u.name).filter(Boolean).join(', ')}
                  </span>
                )}
              </div>

              {isRejecting ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={rejectFeedback}
                    onChange={(e) => setRejectFeedback(e.target.value)}
                    placeholder="Add feedback for why this is being rejected..."
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-red-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setRejectDraftId(null);
                        setRejectFeedback('');
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-white/10 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRejectSubmit(task._id)}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                      Confirm Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto flex gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleApprove(task._id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    {isBusy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setRejectDraftId(task._id);
                      setRejectFeedback('');
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/20 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Approvals;