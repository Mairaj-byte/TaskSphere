import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, useAuth } from '../context/AuthContext';
import {
  CheckSquare, Clock, AlertTriangle, CheckCircle, ArrowRight,
  MessageSquare, Megaphone, Pin, CheckCircle2, ChevronRight, Download,
  Sparkles, ShieldAlert, ArrowUpRight, Calendar, Filter
} from 'lucide-react';

const categoryStyle = {
  'Policy Update': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Holiday': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'General News': 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  'Urgent': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const MemberDashboard = ({ user, tasks = [], handleDownloadReport }) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Task Filter State
  const [filter, setFilter] = useState('All');

  // Cleaned up profile photo URL resolution
    const profilePhotoUrl = user?.profilePhoto
      ? (user.profilePhoto.startsWith('http') 
          ? user.profilePhoto 
          : `${API_BASE.replace(/\/api$/, '')}${user.profilePhoto}`)
      : null;

  // Announcement States
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [announcementLoading, setAnnouncementLoading] = useState(true);

  // Dynamic Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // ---------------- FETCH LATEST ANNOUNCEMENT ----------------
  const fetchLatestAnnouncement = async () => {
    try {
      setAnnouncementLoading(true);
      const res = await fetch(`${API_BASE}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
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
  const totalAssigned = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Approved').length;
  const completionPercentage = totalAssigned > 0 ? Math.round((completedTasks / totalAssigned) * 100) : 0;

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
    <div className="mx-auto max-w-7xl space-y-8 p-2 sm:p-4 text-slate-100">

      {/* 1. HERO & USER COCKPIT HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r
        from-[#16213E]
        via-[#1D2951]
        to-[#16213E]
        border-[#31436A] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#DC9750]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#DC9750]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center shrink-0 w-16 h-16 rounded-2xl bg-[#DC9750] text-white font-bold text-2xl shadow-lg shadow-indigo-500/25 ring-4 ring-[#31436A] overflow-hidden">
              {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={user?.name || "User"}
                className="h-14 w-14 rounded-full border-2 border-indigo-500 object-cover shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}

              {/* Active Status Badge */}
              <span className="absolute bottom-0 right-0 z-10 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider text-[#DC9750] uppercase bg-[#DC9750]/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  {getGreeting()}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                {user?.name || 'Workspace Member'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Here's your personal focus hub for today. You've completed <span className="text-[#DC9750] font-semibold">{completionPercentage}%</span> of assigned goals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D2951] hover:bg-[#243457] text-slate-200 border border-[#31436A] font-medium text-xs sm:text-sm transition-all shadow-md hover:shadow-indigo-500/10 active:scale-95"
            >
              <Download size={16} className="text-slate-400" />
              <span>Report</span>
            </button>

            <button
              onClick={() => navigate('/tasks')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r bg-[#DC9750] hover:bg-[#C78645] text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <span>Workspace Tasks</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FEATURED ANNOUNCEMENT SPOTLIGHT BANNER */}
      {!announcementLoading && latestAnnouncement && (
        <div className="group relative overflow-hidden rounded-2xl border border-[#31436A] bg-gradient-to-r from-[#1D2951] via-[#16213E] to-[#1D2951] p-5 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-indigo-500/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#DC9750]/10 border border-[#DC9750]/30 text-[#DC9750] shrink-0 shadow-inner">
                <Megaphone size={22} className="animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {latestAnnouncement.pinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 uppercase tracking-wide">
                      <Pin size={10} /> Pinned Broadcast
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${categoryStyle[latestAnnouncement.category] || categoryStyle['General News']}`}>
                    {latestAnnouncement.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(latestAnnouncement.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                  {latestAnnouncement.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-3xl leading-relaxed">
                  {latestAnnouncement.body}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end lg:self-center pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5 w-full lg:w-auto justify-end">
              {hasAcknowledged(latestAnnouncement) ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  <CheckCircle2 size={15} /> Acknowledged
                </span>
              ) : (
                <button
                  onClick={() => acknowledge(latestAnnouncement._id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC9750] hover:bg-[#C78645] text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
                >
                  <CheckCircle2 size={15} /> Acknowledge Notice
                </button>
              )}

              <button
                onClick={() => navigate('/announcements')}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition"
              >
                All News <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. BENTO METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="relative group overflow-hidden rounded-2xl border border-[#31436A] bg-[#1D2951] p-5 backdrop-blur-md hover:border-[#DC9750] hover:shadow-lg hover:shadow-[#DC9750]/15 transition-all duration-300">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <span>Active Tasks</span>
            <div className="p-2 rounded-xl bg-[#DC9750]/10 border border-[#DC9750]/30 text-[#DC9750]">
              <CheckSquare size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{myTasks.length}</span>
            <span className="text-xs text-slate-400">assigned to you</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r
                            from-[#C78645]
                            via-[#DC9750]
                            to-[#F2C27D] h-1.5 rounded-full" style={{ width: `${Math.min(myTasks.length * 10, 100)}%` }} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-[#1D2951] p-5 backdrop-blur-md hover:border-[#DC9750] hover:shadow-lg hover:shadow-[#DC9750]/15 transition-all duration-300">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <span>Due Today</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{myDueToday.length}</span>
            <span className="text-xs text-slate-400">requires action</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: myDueToday.length > 0 ? '100%' : '0%' }} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-[#1D2951] p-5 backdrop-blur-md hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <span>In Review</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{myPendingApproval.length}</span>
            <span className="text-xs text-slate-400">awaiting signoff</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: myPendingApproval.length > 0 ? '100%' : '0%' }} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-[#1D2951] p-5 backdrop-blur-md hover:border-rose-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <span>Needs Revisions</span>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{myRejected.length}</span>
            <span className="text-xs text-slate-400">manager feedback</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: myRejected.length > 0 ? '100%' : '0%' }} />
          </div>
        </div>
      </div>

      {/* 4. DUAL COLUMN WORKFLOW SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT FOCUS: Interactive Task Feed (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-[#31436A] bg-[#1D2951] p-6 backdrop-blur-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Focus Action List</h2>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-[#31436A]">
                {['All', 'Today', 'This Week', 'Overdue'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${filter === tab
                        ? 'bg-[#DC9750] text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Items Stream */}
            <div className="mt-4 space-y-2.5">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl">
                  <CheckCircle size={36} className="text-emerald-400/60 mb-2" />
                  <p className="text-sm font-medium text-slate-300">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {filter === 'All'
                      ? 'No outstanding tasks waiting for your action.'
                      : `No tasks matched filter "${filter}".`}
                  </p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Approved';
                  return (
                    <div
                      key={task._id}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      className="group flex items-center justify-between rounded-2xl border border-white/5 bg-[#243457] p-4 hover:bg-[#2A3B63] hover:border-[#DC9750] cursor-pointer transition-all duration-200 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${isOverdue ? 'bg-rose-500 shadow-sm shadow-rose-500' : 'bg-indigo-400'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                            {task.title}
                          </p>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock size={11} className={isOverdue ? 'text-rose-400' : 'text-slate-500'} />
                            <span className={isOverdue ? 'text-rose-400 font-medium' : ''}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Open
                        </span>
                        <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-[#DC9750] transition-all">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filteredTasks.length} action items</span>
            <button onClick={() => navigate('/tasks')} className="text-indigo-400 hover:underline">
              View All Tasks &rarr;
            </button>
          </div>
        </div>

        {/* RIGHT FOCUS: Feedback & Revisions Stream (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-[#31436A] bg-[#1D2951] p-6 backdrop-blur-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-400" />
                <h2 className="text-lg font-bold text-white">Manager Feedback Stream</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                {myRejected.length} pending
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {myRejected.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl">
                  <CheckCircle size={36} className="text-emerald-400/60 mb-2" />
                  <p className="text-sm font-semibold text-slate-200">Clear Records</p>
                  <p className="text-xs text-slate-500 mt-1">No tasks returned for edit. Great quality work!</p>
                </div>
              ) : (
                myRejected.map(task => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                    className="group rounded-2xl border border-[#DC9750]/30 bg-[#243457] p-4 space-y-2.5 cursor-pointer hover:bg-[#2A3B63] hover:border-[#DC9750] transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                        {task.title}
                      </p>
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                        Revision Needed
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-rose-200 bg-slate-950/60 p-3 rounded-xl border border-rose-500/20">
                      <MessageSquare size={15} className="shrink-0 text-rose-400 mt-0.5" />
                      <p className="italic leading-relaxed">"{task.feedback || 'Please review and resubmit changes.'}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-xs text-[#C9C2B8] text-center">
            Click on any item to view details & submit revisions
          </div>
        </div>

      </div>
    </div>
  );
};

export default MemberDashboard;