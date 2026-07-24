import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadReport } from "../utils/reportGenerator";
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  CheckSquare, Clock, AlertTriangle, Users, 
  ArrowRight, MessageSquare, History, CheckCircle 
} from 'lucide-react';

// Dashboard
const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tasksRes = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      if (user.role === 'admin') {
        const usersRes = await fetch(`${API_BASE}/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);

        const logsRes = await fetch(`${API_BASE}/tasks/audit/logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsData = await logsRes.json();
        setAuditLogs(Array.isArray(logsData) ? logsData : []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/10 border-t-indigo-500"></div>
      </div>
    );
  }

  // Metrics
  const totalTasks = tasks.length;
  const pendingApprovals = tasks.filter(t => t.status === 'Completed (Pending Approval)').length;
  const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
  const approvedTasks = tasks.filter(t => t.status === 'Approved').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const todoTasks = tasks.filter(t => t.status === 'To Do').length;
  const rejectedTasks = tasks.filter(t => t.status === 'Rejected').length;
  const activeMembers = users.filter(u => u.role === 'member' && u.active).length;

  const getPercentage = (count) => (totalTasks === 0 ? 0 : Math.round((count / totalTasks) * 100));

  const handleDownloadReport = () => {
  downloadReport({
    generatedBy: user.name,
    role: user.role,

    totalTasks,
    approvedTasks,
    pendingApprovals,
    overdueTasks,
    inProgressTasks,
    todoTasks,
    rejectedTasks,

    activeMembers,
    totalMembers: users.length
  });
};

  const formatLogAction = (log) => {
    const taskTitle = log.taskId ? log.taskId.title : 'Deleted Task';
    switch (log.action) {
      case 'Created': return `created task "${taskTitle}"`;
      case 'Status Changed': return `changed status of "${taskTitle}" from ${log.oldValue} to ${log.newValue}`;
      case 'Comment Added': return `commented on "${taskTitle}"`;
      case 'Feedback Added': return `added rejection feedback to "${taskTitle}"`;
      case 'Title Updated': return `renamed task to "${taskTitle}"`;
      default: return `${log.action.toLowerCase()} on "${taskTitle}"`;
    }
  };

  // ---------------- MANAGER DASHBOARD ----------------
  if (user.role === 'admin') {
    const pendingTasksList = tasks.filter(t => t.status === 'Completed (Pending Approval)');
    const overdueTasksList = tasks.filter(t => t.status === 'Overdue');

    return (
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">Manager Dashboard</h2>
            <p className="text-sm text-gray-400">Welcome back, {user.name}. Here is your team's workflow status.</p>
          </div>
          <div className="flex gap-3">

    <button
        onClick={handleDownloadReport}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
    >
        Download Report
    </button>

    <button
        onClick={() => navigate('/tasks')}
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
    >
        Create New Task
    </button>

</div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Total Active Tasks</span>
              <CheckSquare size={20} className="text-indigo-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-white">{totalTasks}</div>
            <p className="mt-1 text-xs text-gray-400">{todoTasks} todo, {inProgressTasks} in progress</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Pending Approval</span>
              <Clock size={20} className="text-amber-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-amber-400">{pendingApprovals}</div>
            <p className="mt-1 text-xs text-gray-400">Requires your review</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Overdue Tasks</span>
              <AlertTriangle size={20} className="text-rose-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-rose-400">{overdueTasks}</div>
            <p className="mt-1 text-xs text-gray-400">Missed deadlines</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Active Team Members</span>
              <Users size={20} className="text-emerald-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-white">{activeMembers}</div>
            <p className="mt-1 text-xs text-gray-400">Out of {users.length} total users</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Status Breakdown */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-6 backdrop-blur-md space-y-4">
              <h3 className="font-heading text-lg font-semibold text-white">Task Status Breakdown</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-gray-300 mb-1">
                    <span>Approved / Completed</span>
                    <span>{getPercentage(approvedTasks)}% ({approvedTasks})</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${getPercentage(approvedTasks)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-300 mb-1">
                    <span>In Progress</span>
                    <span>{getPercentage(inProgressTasks)}% ({inProgressTasks})</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${getPercentage(inProgressTasks)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-300 mb-1">
                    <span>Pending Approval</span>
                    <span>{getPercentage(pendingApprovals)}% ({pendingApprovals})</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${getPercentage(pendingApprovals)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-300 mb-1">
                    <span>Overdue</span>
                    <span>{getPercentage(overdueTasks)}% ({overdueTasks})</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${getPercentage(overdueTasks)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-6 backdrop-blur-md space-y-4">
              <h3 className="font-heading text-lg font-semibold text-amber-400">Pending Approvals ({pendingTasksList.length})</h3>
              {pendingTasksList.length === 0 ? (
                <p className="text-sm text-gray-400">No tasks currently awaiting approval.</p>
              ) : (
                <div className="space-y-2">
                  {pendingTasksList.map(task => (
                    <div
                      key={task._id}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <p className="text-xs text-gray-400">Assigned: {task.assignedTo?.map(u => u.name).join(', ')}</p>
                      </div>
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-6 backdrop-blur-md space-y-4">
              <h3 className="font-heading text-lg font-semibold text-white">Recent Activity Feed</h3>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-gray-400">No activity logged yet.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {auditLogs.map(log => (
                    <div key={log._id} className="flex items-start gap-3 text-xs">
                      <div className="mt-0.5 rounded-full bg-white/10 p-1 text-gray-300">
                        <History size={14} />
                      </div>
                      <div>
                        <p className="text-gray-300">
                          <strong className="text-white">{log.userId ? log.userId.name : 'System'}</strong> {formatLogAction(log)}
                        </p>
                        <p className="text-gray-500 text-[10px]">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue Alert */}
            {overdueTasksList.length > 0 && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-md space-y-3">
                <h3 className="font-heading text-lg font-semibold text-rose-400">Critical Overdue Tasks</h3>
                <div className="space-y-2">
                  {overdueTasksList.slice(0, 3).map(task => (
                    <div
                      key={task._id}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <p className="text-xs text-rose-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- TEAM MEMBER DASHBOARD ----------------
  const myTasks = tasks.filter(t => t.status !== 'Approved');
  const myDueToday = tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== 'Approved');
  const myPendingApproval = tasks.filter(t => t.status === 'Completed (Pending Approval)');
  const myRejected = tasks.filter(t => t.status === 'Rejected');

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
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
    >
        Download Report
    </button>

    <button
        onClick={() => navigate('/tasks')}
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
    >
        Go to Tasks Panel
    </button>

</div>
      </div>

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
        {/* Active Focus Tasks */}
        <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-6 backdrop-blur-md space-y-4">
          <h3 className="font-heading text-lg font-semibold text-white">Tasks Requiring Attention</h3>
          {myTasks.length === 0 ? (
            <p className="text-sm text-gray-400">Outstanding! You have no pending tasks assigned.</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map(task => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 cursor-pointer transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    <p className="text-xs text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager Feedback */}
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

export default Dashboard;