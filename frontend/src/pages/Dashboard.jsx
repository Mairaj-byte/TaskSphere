import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  CheckSquare, Clock, AlertTriangle, Users, 
  ArrowRight, MessageSquare, History, CheckCircle, FileText 
} from 'lucide-react';

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Common State
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Tasks
      const tasksRes = await fetch(`${API_BASE}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      if (user.role === 'admin') {
        // Fetch Users (Admin only)
        const usersRes = await fetch(`${API_BASE}/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);

        // Fetch Audit Logs (Admin only)
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
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  // Helper metrics calculations
  const totalTasks = tasks.length;
  const pendingApprovals = tasks.filter(t => t.status === 'Completed (Pending Approval)').length;
  const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
  const approvedTasks = tasks.filter(t => t.status === 'Approved').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const todoTasks = tasks.filter(t => t.status === 'To Do').length;
  const rejectedTasks = tasks.filter(t => t.status === 'Rejected').length;

  const activeMembers = users.filter(u => u.role === 'member' && u.active).length;

  // Visual status percentage calculation
  const getPercentage = (count) => {
    if (totalTasks === 0) return 0;
    return Math.round((count / totalTasks) * 100);
  };

  const formatLogAction = (log) => {
    const userName = log.userId ? log.userId.name : 'System';
    const taskTitle = log.taskId ? log.taskId.title : 'Deleted Task';
    
    switch (log.action) {
      case 'Created':
        return `created task "${taskTitle}"`;
      case 'Status Changed':
        return `changed status of "${taskTitle}" from ${log.oldValue} to ${log.newValue}`;
      case 'Comment Added':
        return `commented on "${taskTitle}"`;
      case 'Feedback Added':
        return `added rejection feedback to "${taskTitle}"`;
      case 'Title Updated':
        return `renamed task to "${log.newValue}"`;
      default:
        return `${log.action.toLowerCase()} on "${taskTitle}"`;
    }
  };

  // -------------------- MANAGER DASHBOARD --------------------
  if (user.role === 'admin') {
    const pendingTasksList = tasks.filter(t => t.status === 'Completed (Pending Approval)');
    const overdueTasksList = tasks.filter(t => t.status === 'Overdue');

    return (
      <div className="dashboard-view">
        <div className="dashboard-header">
          <div>
            <h2>Manager Dashboard</h2>
            <p className="welcome-text">Welcome back, {user.name}. Here is your team's workflow status.</p>
          </div>
          <button onClick={() => navigate('/tasks')} className="btn btn-primary">
            <CheckSquare size={16} />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="metrics-grid">
          <div className="metric-card glass-card">
            <div className="metric-header">
              <span>Total Active Tasks</span>
              <CheckSquare size={20} className="icon-primary" />
            </div>
            <div className="metric-value">{totalTasks}</div>
            <p className="metric-subtext">{todoTasks} todo, {inProgressTasks} in progress</p>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-header">
              <span>Pending Approval</span>
              <Clock size={20} className="icon-pending" />
            </div>
            <div className="metric-value text-pending">{pendingApprovals}</div>
            <p className="metric-subtext">Requires your review</p>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-header">
              <span>Overdue Tasks</span>
              <AlertTriangle size={20} className="icon-overdue" />
            </div>
            <div className="metric-value text-overdue">{overdueTasks}</div>
            <p className="metric-subtext">Missed deadlines</p>
          </div>

          <div className="metric-card glass-card">
            <div className="metric-header">
              <span>Active Team Members</span>
              <Users size={20} className="icon-success" />
            </div>
            <div className="metric-value">{activeMembers}</div>
            <p className="metric-subtext">Out of {users.length} total users</p>
          </div>
        </div>

        <div className="dashboard-main-grid">
          {/* Left Panel: Status breakdown + Overdue Alert */}
          <div className="left-panel flex-column">
            {/* Visual Task Distribution */}
            <div className="glass-card dashboard-section">
              <h3 className="section-title">Task Status Breakdown</h3>
              <div className="status-progress-container">
                <div className="status-progress-item">
                  <div className="progress-label">
                    <span>Approved / Completed</span>
                    <span>{getPercentage(approvedTasks)}% ({approvedTasks})</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill fill-approved" style={{ width: `${getPercentage(approvedTasks)}%` }}></div>
                  </div>
                </div>

                <div className="status-progress-item">
                  <div className="progress-label">
                    <span>In Progress</span>
                    <span>{getPercentage(inProgressTasks)}% ({inProgressTasks})</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill fill-progress" style={{ width: `${getPercentage(inProgressTasks)}%` }}></div>
                  </div>
                </div>

                <div className="status-progress-item">
                  <div className="progress-label">
                    <span>Pending Approval</span>
                    <span>{getPercentage(pendingApprovals)}% ({pendingApprovals})</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill fill-pending" style={{ width: `${getPercentage(pendingApprovals)}%` }}></div>
                  </div>
                </div>

                <div className="status-progress-item">
                  <div className="progress-label">
                    <span>Overdue</span>
                    <span>{getPercentage(overdueTasks)}% ({overdueTasks})</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill fill-overdue" style={{ width: `${getPercentage(overdueTasks)}%` }}></div>
                  </div>
                </div>

                <div className="status-progress-item">
                  <div className="progress-label">
                    <span>Rejected</span>
                    <span>{getPercentage(rejectedTasks)}% ({rejectedTasks})</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill fill-rejected" style={{ width: `${getPercentage(rejectedTasks)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Approvals Queue */}
            <div className="glass-card dashboard-section flex-1">
              <h3 className="section-title text-pending">Pending Approvals ({pendingTasksList.length})</h3>
              {pendingTasksList.length === 0 ? (
                <p className="empty-text">No tasks currently awaiting approval.</p>
              ) : (
                <div className="approval-queue-list">
                  {pendingTasksList.map(task => (
                    <div key={task._id} className="queue-item" onClick={() => navigate(`/tasks/${task._id}`)}>
                      <div className="queue-info">
                        <p className="queue-task-title">{task.title}</p>
                        <p className="queue-task-assignee">Assigned to: {task.assignedTo.map(u => u.name).join(', ')}</p>
                      </div>
                      <ArrowRight size={16} className="queue-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Recent activity + Overdue List */}
          <div className="right-panel flex-column">
            {/* Recent Activity Feed */}
            <div className="glass-card dashboard-section flex-1">
              <h3 className="section-title">Recent Activity Feed</h3>
              {auditLogs.length === 0 ? (
                <p className="empty-text">No activity logged yet.</p>
              ) : (
                <div className="activity-feed">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="activity-item">
                      <div className="activity-icon-container">
                        <History size={14} className="activity-icon" />
                      </div>
                      <div className="activity-details">
                        <p className="activity-text">
                          <strong>{log.userId ? log.userId.name : 'System'}</strong> {formatLogAction(log)}
                        </p>
                        <p className="activity-time">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue alert list */}
            {overdueTasksList.length > 0 && (
              <div className="glass-card dashboard-section section-overdue-alert">
                <h3 className="section-title text-overdue">Critical Overdue Tasks</h3>
                <div className="overdue-list">
                  {overdueTasksList.slice(0, 3).map(task => (
                    <div key={task._id} className="overdue-item" onClick={() => navigate(`/tasks/${task._id}`)}>
                      <span className="overdue-indicator"></span>
                      <div className="overdue-info">
                        <p className="overdue-title">{task.title}</p>
                        <p className="overdue-date">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {overdueTasksList.length > 3 && (
                    <button onClick={() => navigate('/tasks')} className="btn-view-all">
                      View all {overdueTasksList.length} overdue tasks <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------- TEAM MEMBER DASHBOARD --------------------
  // Calculate specific member sub-metrics
  const myTasks = tasks.filter(t => t.status !== 'Approved');
  const myDueToday = tasks.filter(t => {
    const isDueToday = new Date(t.dueDate).toDateString() === new Date().toDateString();
    return isDueToday && t.status !== 'Approved';
  });
  const myPendingApproval = tasks.filter(t => t.status === 'Completed (Pending Approval)');
  const myRejected = tasks.filter(t => t.status === 'Rejected');

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <div>
          <h2>My Workspace Dashboard</h2>
          <p className="welcome-text">Hello, {user.name}. Here is a summary of your assigned tasks.</p>
        </div>
        <button onClick={() => navigate('/tasks')} className="btn btn-primary">
          <span>Go to Tasks Panel</span>
        </button>
      </div>

      {/* Member Analytics Cards */}
      <div className="metrics-grid">
        <div className="metric-card glass-card">
          <div className="metric-header">
            <span>My Active Tasks</span>
            <CheckSquare size={20} className="icon-primary" />
          </div>
          <div className="metric-value">{myTasks.length}</div>
          <p className="metric-subtext">Needs action or in progress</p>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-header">
            <span>Due Today</span>
            <Clock size={20} className="icon-pending" />
          </div>
          <div className="metric-value text-pending">{myDueToday.length}</div>
          <p className="metric-subtext">Deadline is today</p>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-header">
            <span>Awaiting Approval</span>
            <CheckCircle size={20} className="icon-success" />
          </div>
          <div className="metric-value text-success">{myPendingApproval.length}</div>
          <p className="metric-subtext">Submitted to Manager</p>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-header">
            <span>Rejected / Requires Edit</span>
            <AlertTriangle size={20} className="icon-overdue" />
          </div>
          <div className="metric-value text-overdue">{myRejected.length}</div>
          <p className="metric-subtext">Needs feedback review</p>
        </div>
      </div>

      <div className="dashboard-main-grid">
        {/* Left Panel: Primary Focus Tasks (Due Today, Overdue, or In Progress) */}
        <div className="left-panel flex-column">
          <div className="glass-card dashboard-section flex-1">
            <h3 className="section-title">Tasks Requiring Attention</h3>
            {myTasks.length === 0 ? (
              <p className="empty-text">Outstanding! You have no pending tasks assigned.</p>
            ) : (
              <div className="focus-tasks-list">
                {myTasks.map(task => {
                  let alertBadge = null;
                  if (task.status === 'Overdue') {
                    alertBadge = <span className="badge badge-overdue">OVERDUE</span>;
                  } else if (new Date(task.dueDate).toDateString() === new Date().toDateString()) {
                    alertBadge = <span className="badge badge-pending">DUE TODAY</span>;
                  } else if (task.status === 'Rejected') {
                    alertBadge = <span className="badge badge-rejected">REJECTED</span>;
                  } else {
                    alertBadge = <span className={`badge badge-${task.status.toLowerCase().replace(/ \(.+\)/g, '')}`}>{task.status}</span>;
                  }

                  return (
                    <div key={task._id} className="focus-task-item" onClick={() => navigate(`/tasks/${task._id}`)}>
                      <div className="focus-task-info">
                        <div className="focus-task-title-row">
                          <p className="focus-task-title">{task.title}</p>
                          {alertBadge}
                        </div>
                        <p className="focus-task-deadline">Due: {new Date(task.dueDate).toLocaleDateString()} at {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <ArrowRight size={16} className="focus-arrow" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Rejections with Manager Comments */}
        <div className="right-panel flex-column">
          <div className="glass-card dashboard-section flex-1">
            <h3 className="section-title text-overdue">Recent Manager Feedback</h3>
            {myRejected.length === 0 ? (
              <div className="empty-feedback">
                <CheckCircle size={32} className="empty-feedback-icon" />
                <p>No rejection feedbacks. Great job!</p>
              </div>
            ) : (
              <div className="feedback-feed">
                {myRejected.map(task => (
                  <div key={task._id} className="feedback-card" onClick={() => navigate(`/tasks/${task._id}`)}>
                    <p className="feedback-task-title">{task.title}</p>
                    <div className="feedback-bubble">
                      <MessageSquare size={14} className="bubble-icon" />
                      <p className="feedback-text">"{task.feedback}"</p>
                    </div>
                    <p className="feedback-time">Rejected by {task.approvedBy ? task.approvedBy.name : 'Manager'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
