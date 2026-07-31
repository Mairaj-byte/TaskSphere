import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, useAuth } from '../context/AuthContext';
import { 
  CheckSquare, Clock, AlertTriangle, CheckCircle, ArrowRight, 
  MessageSquare, Megaphone, Pin, CheckCircle2, ChevronRight, Download
} from 'lucide-react';

const categoryStyle = {
  'Policy Update': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Holiday': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'General News': 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  'Urgent': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const MemberDashboard = ({ user, tasks, handleDownloadReport }) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Task Filter State
  const [filter, setFilter] = useState('All');

  // Announcement States
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [announcementLoading, setAnnouncementLoading] = useState(true);

  // ---------------- FETCH LATEST ANNOUNCEMENT ----------------
  const fetchLatestAnnouncement = async () => {
    try {
      setAnnouncementLoading(true);
      const res = await fetch(`${API_BASE}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Prioritize pinned announcement, otherwise take the top/newest
        const pinned = data.find(a => a.pinned);
        setLatestAnnouncement(pinned || data[0]);
      } else {
        setLatestAnnouncement(null);
      }
    } catch (err) {
      console.error('Failed to fetch announcements for dashboard', err);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestAnnouncement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acknowledge = async (id) => {
    try {
      await fetch(`${API_BASE}/announcements/${id}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLatestAnnouncement();
    } catch (err) {
      console.error('Failed to acknowledge announcement', err);
    }
  };

  const hasAcknowledged = (announcement) =>
    announcement?.acknowledgedBy?.some((a) => (a.user?._id || a.user) === user?._id);

  // ---------------- TASK CALCULATIONS ----------------
  const myTasks = tasks.filter(t => t.status !== 'Approved');
  const myDueToday = tasks.filter(
    t => new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== 'Approved'
  );
  const myPendingApproval = tasks.filter(t => t.status === 'Completed (Pending Approval)');
  const myRejected = tasks.filter(t => t.status === 'Rejected');

  // Filter logic for "Tasks Requiring Attention"
  const filteredTasks = myTasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (filter === 'Today') {
      return startOfDueDate.getTime() === startOfToday.getTime();
    }

    if (filter === 'This Week') {
      const endOfWeek = new Date(startOfToday);
      endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
      return startOfDueDate >= startOfToday && startOfDueDate <= endOfWeek;
    }

    if (filter === 'Overdue') {
      return task.status === 'Overdue' || startOfDueDate < startOfToday;
    }

    return true; // 'All'
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">My Workspace Dashboard</h2>
          <p className="text-sm text-gray-400">Hello, {user.name}. Here is a summary of your assigned tasks.</p>
        </div>
        <div className="flex gap-3">
         <button
            onClick={handleDownloadReport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-all duration-200 disabled:opacity-50"
          >
            <Download size={18} />
            Download Report
          </button>

          <button
            onClick={() => navigate('/tasks')}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            Go to Tasks Panel
          </button>
        </div>
      </div>

      {/* LATEST ANNOUNCEMENT BANNER */}
      {!announcementLoading && latestAnnouncement && (
        <div className="rounded-2xl border border-indigo-500/20 bg-[#0d1426]/80 p-5 backdrop-blur-md relative overflow-hidden shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                <Megaphone size={22} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {latestAnnouncement.pinned && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      <Pin size={11} /> Pinned
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${categoryStyle[latestAnnouncement.category] || categoryStyle['General News']}`}>
                    {latestAnnouncement.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    &middot; {new Date(latestAnnouncement.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-base font-semibold text-white">{latestAnnouncement.title}</h4>
                <p className="text-sm text-gray-300 line-clamp-2">{latestAnnouncement.body}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              {hasAcknowledged(latestAnnouncement) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                  <CheckCircle2 size={14} /> Acknowledged
                </span>
              ) : (
                <button
                  onClick={() => acknowledge(latestAnnouncement._id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                >
                  <CheckCircle2 size={14} /> Acknowledge
                </button>
              )}

              <button
                onClick={() => navigate('/announcements')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium border border-white/10 transition"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>My Active Tasks</span>
            <CheckSquare size={20} className="text-indigo-400" />
          </div>
          <div className="mt-2 text-3xl font-bold text-white">{myTasks.length}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Due Today</span>
            <Clock size={20} className="text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-400">{myDueToday.length}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Awaiting Approval</span>
            <CheckCircle size={20} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-400">{myPendingApproval.length}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Rejected / Edits Needed</span>
            <AlertTriangle size={20} className="text-rose-400" />
          </div>
          <div className="mt-2 text-3xl font-bold text-rose-400">{myRejected.length}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-6 backdrop-blur-md space-y-4">
          {/* Section Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold text-white">Tasks Requiring Attention</h3>
            
            <div className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1 border border-white/10">
              {['All', 'Today', 'This Week', 'Overdue'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    filter === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              {filter === 'All' 
                ? 'Outstanding! You have no pending tasks assigned.' 
                : `No tasks found for "${filter}".`}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    <p className="text-xs text-gray-400">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-6 backdrop-blur-md space-y-4">
          <h3 className="font-heading text-lg font-semibold text-rose-400">Recent Manager Feedback</h3>
          {myRejected.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
              <CheckCircle size={32} className="text-emerald-400 mb-2" />
              <p className="text-sm">No rejection feedback. Great job!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRejected.map(task => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2 cursor-pointer hover:bg-rose-500/10 transition-all"
                >
                  <p className="text-sm font-semibold text-white">{task.title}</p>
                  <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/20">
                    <MessageSquare size={14} className="shrink-0 mt-0.5" />
                    <p>"{task.feedback}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;