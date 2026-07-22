import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE } from '../context/AuthContext';
import { 
  ArrowLeft, Calendar, User, MessageSquare, History, FileText, 
  Play, CheckCircle, XCircle, AlertCircle, ArrowUpCircle 
} from 'lucide-react';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Task & Sub-states
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Input states
  const [newComment, setNewComment] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchTaskDetails = async () => {
    try {
      // 1. Fetch Task
      const taskRes = await fetch(`${API_BASE}/tasks/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!taskRes.ok) {
        if (taskRes.status === 403) alert('You do not have permission to view this task.');
        navigate('/tasks');
        return;
      }
      const taskData = await taskRes.json();
      setTask(taskData);

      // 2. Fetch Comments
      const commentsRes = await fetch(`${API_BASE}/tasks/${id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const commentsData = await commentsRes.json();
      setComments(Array.isArray(commentsData) ? commentsData : []);

      // 3. Fetch History Logs
      const historyRes = await fetch(`${API_BASE}/tasks/${id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Error loading task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleStatusChange = async (newStatus, feedback = '') => {
    setActionError('');
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, feedback })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsRejectDialogOpen(false);
        setIsApproveConfirmOpen(false);
        setFeedbackText('');
        fetchTaskDetails();
      } else {
        setActionError(data.error || 'Failed to update task status.');
      }
    } catch (err) {
      setActionError('Network error. Failed to update status.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/tasks/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newComment.trim() })
      });
      
      if (res.ok) {
        setNewComment('');
        fetchTaskDetails();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to post comment.');
      }
    } catch (err) {
      alert('Error posting comment.');
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const slug = status.toLowerCase().replace(/ \(.+\)/g, '').replace(' ', '-');
    return <span className={`badge badge-${slug}`}>{status}</span>;
  };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  if (!task) {
    return <div className="error-container"><p>Task not found.</p></div>;
  }

  const isAssignee = task.assignedTo.some(u => u._id === user._id);
  const isAdmin = user.role === 'admin';

  return (
    <div className="task-details-page">
      <button onClick={() => navigate('/tasks')} className="btn-back btn btn-secondary">
        <ArrowLeft size={16} />
        <span>Back to Tasks</span>
      </button>

      {actionError && (
        <div className="form-error-msg error-banner">
          <AlertCircle size={14} />
          <span>{actionError}</span>
        </div>
      )}

      <div className="task-detail-grid">
        {/* Left Side: Task Content & Actions */}
        <div className="task-content-column">
          <div className="glass-card task-card-details">
            <div className="details-header">
              <div className="header-titles">
                <h2>{task.title}</h2>
                <div className="badges-row">
                  {getStatusBadge(task.status)}
                  <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority} Priority</span>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="details-actions">
                {/* Member Workflow Actions */}
                {isAssignee && !isAdmin && (
                  <>
                    {task.status === 'To Do' && (
                      <button 
                        onClick={() => handleStatusChange('In Progress')} 
                        className="btn btn-primary btn-action-grow"
                      >
                        <Play size={16} />
                        <span>Start Work</span>
                      </button>
                    )}
                    {(task.status === 'In Progress' || task.status === 'Rejected') && (
                      <button 
                        onClick={() => handleStatusChange('Completed (Pending Approval)')} 
                        className="btn btn-success btn-action-grow"
                      >
                        <ArrowUpCircle size={16} />
                        <span>Submit for Approval</span>
                      </button>
                    )}
                  </>
                )}

                {/* Manager Workflow Actions */}
                {isAdmin && (
                  <>
                    {/* Admins can start tasks too */}
                    {task.status === 'To Do' && (
                      <button 
                        onClick={() => handleStatusChange('In Progress')} 
                        className="btn btn-primary"
                      >
                        <Play size={16} />
                        <span>Start Work</span>
                      </button>
                    )}
                    {task.status === 'In Progress' && (
                      <button 
                        onClick={() => handleStatusChange('Completed (Pending Approval)')} 
                        className="btn btn-success"
                      >
                        <ArrowUpCircle size={16} />
                        <span>Submit for Approval</span>
                      </button>
                    )}
                    {task.status === 'Completed (Pending Approval)' && (
                      <div className="manager-workflow-row">
                        <button 
                          onClick={() => setIsApproveConfirmOpen(true)} 
                          className="btn btn-success"
                        >
                          <CheckCircle size={16} />
                          <span>Approve</span>
                        </button>
                        <button 
                          onClick={() => setIsRejectDialogOpen(true)} 
                          className="btn btn-danger"
                        >
                          <XCircle size={16} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Task Description */}
            <div className="task-section-block">
              <h4>Description</h4>
              <p className="description-text">{task.description || 'No description provided.'}</p>
            </div>

            {/* Rejection Feedback Alert */}
            {task.status === 'Rejected' && task.feedback && (
              <div className="feedback-alert-card">
                <AlertCircle size={20} className="alert-icon-reject" />
                <div className="feedback-alert-content">
                  <h5>Manager Rejection Feedback</h5>
                  <p>"{task.feedback}"</p>
                </div>
              </div>
            )}

            {/* Attachments Section */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="task-section-block attachments-section">
                <h4>Attachments</h4>
                <div className="attachments-grid">
                  {task.attachments.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="attachment-card-link glass-card">
                      <FileText size={18} className="attachment-icon" />
                      <span className="attachment-title" title={url}>{url.substring(0, 45)}...</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Meta Properties (Dates, Assignees) */}
            <div className="details-metadata-grid border-top-glass">
              <div className="meta-item">
                <Calendar size={18} className="meta-icon" />
                <div>
                  <span className="meta-label">Due Date</span>
                  <span className="meta-value">{new Date(task.dueDate).toLocaleString()}</span>
                </div>
              </div>

              <div className="meta-item">
                <User size={18} className="meta-icon" />
                <div>
                  <span className="meta-label">Created By</span>
                  <span className="meta-value">{task.createdBy ? task.createdBy.name : 'Unknown'}</span>
                </div>
              </div>

              <div className="meta-item full-width">
                <div className="assignees-meta-container">
                  <span className="meta-label">Assigned Team Members</span>
                  <div className="assignee-avatars-row">
                    {task.assignedTo.map(u => (
                      <div key={u._id} className="assignee-tag-badge glass-card">
                        <span className="avatar-tag">{u.name.charAt(0).toUpperCase()}</span>
                        <span>{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="glass-card comments-card-container">
            <h3 className="section-title">
              <MessageSquare size={18} />
              <span>Discussion ({comments.length})</span>
            </h3>

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="empty-text">No comments yet. Start the conversation!</p>
              ) : (
                comments.map(c => (
                  <div key={c._id} className="comment-item">
                    <div className="comment-avatar">
                      {c.userId?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="comment-bubble-container">
                      <div className="comment-meta">
                        <span className="comment-author">{c.userId?.name}</span>
                        <span className="comment-author-role">{c.userId?.role === 'admin' ? 'Manager' : 'Team Member'}</span>
                        <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="comment-message-text">{c.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="comment-form-row border-top-glass">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type your message here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">Post Message</button>
            </form>
          </div>
        </div>

        {/* Right Side: Timeline History Log */}
        <div className="history-timeline-column">
          <div className="glass-card timeline-card">
            <h3 className="section-title">
              <History size={18} />
              <span>Audit Trail / History</span>
            </h3>

            <div className="timeline-trail">
              {history.length === 0 ? (
                <p className="empty-text">No history events logged.</p>
              ) : (
                history.map((log, idx) => (
                  <div key={log._id} className="timeline-node">
                    <div className="timeline-line"></div>
                    <div className="timeline-dot"></div>
                    
                    <div className="timeline-content">
                      <div className="timeline-meta">
                        <span className="timeline-actor">{log.userId ? log.userId.name : 'System'}</span>
                        <span className="timeline-time">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="timeline-action">
                        <strong>{log.action}</strong>
                      </p>
                      {log.oldValue && (
                        <p className="timeline-values">
                          <span>From: <del className="val-old">{log.oldValue}</del></span>
                          <span> To: <ins className="val-new">{log.newValue}</ins></span>
                        </p>
                      )}
                      {!log.oldValue && log.newValue && (
                        <p className="timeline-values">
                          <span>Info: <span className="val-new">{log.newValue}</span></span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APPROVE CONFIRMATION DIALOG */}
      {isApproveConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card dialog-confirm">
            <h3>Approve Completed Task</h3>
            <p>Are you sure you want to mark this task as approved? The task status will move to "Approved" and the assigned team members will be notified.</p>
            <div className="modal-footer-actions">
              <button className="btn btn-secondary" onClick={() => setIsApproveConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-success" onClick={() => handleStatusChange('Approved')}>Approve Task</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT FEEDBACK MODAL */}
      {isRejectDialogOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card dialog-confirm">
            <h3>Reject Completed Task</h3>
            <p className="dialog-warning-text">Provide comments or feedback to guide the team member on required edits. Feedback is required.</p>
            
            <div className="form-group text-left">
              <textarea 
                className="form-textarea"
                placeholder="Ex. Exon coordinate translations are missing. Please complete section 3 of the checklist..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
              />
            </div>

            <div className="modal-footer-actions">
              <button className="btn btn-secondary" onClick={() => setIsRejectDialogOpen(false)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleStatusChange('Rejected', feedbackText)}
                disabled={!feedbackText.trim()}
              >
                Reject Task
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-back {
          margin-bottom: 1.5rem;
        }

        .error-banner {
          margin-bottom: 1.5rem;
        }

        .task-detail-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 992px) {
          .task-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        .task-card-details {
          padding: 2rem;
          margin-bottom: 1.5rem;
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 1.25rem;
        }

        @media (max-width: 576px) {
          .details-header {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .header-titles {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .header-titles h2 {
          font-size: 1.6rem;
          line-height: 1.2;
        }

        .manager-workflow-row {
          display: flex;
          gap: 0.5rem;
        }

        .task-section-block {
          margin-bottom: 1.5rem;
        }

        .task-section-block h4 {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .description-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-main);
          white-space: pre-wrap;
        }

        .feedback-alert-card {
          display: flex;
          gap: 1rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 1.25rem;
          border-radius: var(--border-radius-md);
          margin-bottom: 1.5rem;
        }

        .alert-icon-reject {
          color: var(--color-rejected);
          flex-shrink: 0;
        }

        .feedback-alert-content h5 {
          color: var(--color-rejected);
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .feedback-alert-content p {
          font-size: 0.85rem;
          font-style: italic;
          color: var(--text-main);
        }

        .attachments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .attachment-card-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          font-size: 0.8rem;
          border-color: var(--border-glass);
        }

        .attachment-card-link:hover {
          border-color: var(--color-primary);
          background: rgba(99, 102, 241, 0.05);
        }

        .attachment-icon {
          color: var(--color-primary);
        }

        .attachment-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .details-metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          padding-top: 1.5rem;
          margin-top: 1.5rem;
        }

        .border-top-glass {
          border-top: 1px solid var(--border-glass);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .meta-item.full-width {
          grid-column: span 2;
        }

        @media (max-width: 576px) {
          .details-metadata-grid {
            grid-template-columns: 1fr;
          }
          .meta-item.full-width {
            grid-column: span 1;
          }
        }

        .meta-icon {
          color: var(--text-muted);
        }

        .meta-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.15rem;
        }

        .meta-value {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .assignees-meta-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        .assignee-avatars-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .assignee-tag-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
          border-radius: var(--border-radius-sm);
        }

        .avatar-tag {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Discussion panel styling */
        .comments-card-container {
          padding: 2rem;
        }

        .section-title {
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-glass);
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 1.5rem;
          padding-right: 0.25rem;
        }

        .comment-item {
          display: flex;
          gap: 0.75rem;
        }

        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: #fff;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 8px rgba(99, 102, 241, 0.2);
        }

        .comment-bubble-container {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-glass);
          padding: 0.75rem 1rem;
          border-radius: var(--border-radius-sm);
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .comment-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          flex-wrap: wrap;
        }

        .comment-author {
          font-weight: 600;
        }

        .comment-author-role {
          background: rgba(255,255,255,0.07);
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
          color: var(--text-muted);
          font-size: 0.65rem;
        }

        .comment-time {
          color: var(--text-muted);
          font-size: 0.7rem;
        }

        .comment-message-text {
          font-size: 0.85rem;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .comment-form-row {
          display: flex;
          gap: 0.75rem;
          padding-top: 1.5rem;
        }

        .comment-form-row input {
          flex: 1;
        }

        /* Timeline styles */
        .timeline-card {
          padding: 2rem;
        }

        .timeline-trail {
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .timeline-node {
          display: flex;
          position: relative;
          padding-left: 2rem;
          padding-bottom: 1.5rem;
        }

        .timeline-node:last-child {
          padding-bottom: 0;
        }

        .timeline-line {
          position: absolute;
          left: 6px;
          top: 8px;
          bottom: -22px;
          width: 2px;
          background: var(--border-glass);
        }

        .timeline-node:last-child .timeline-line {
          display: none;
        }

        .timeline-dot {
          position: absolute;
          left: 2px;
          top: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 6px var(--color-primary);
          z-index: 1;
        }

        .timeline-content {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .timeline-meta {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .timeline-actor {
          font-weight: 600;
        }

        .timeline-action {
          font-size: 0.8rem;
          line-height: 1.3;
        }

        .timeline-values {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: rgba(0,0,0,0.15);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          margin-top: 0.2rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .val-old {
          color: var(--color-rejected);
          text-decoration: line-through;
        }

        .val-new {
          color: var(--color-approved);
        }

        .dialog-warning-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .text-left {
          text-align: left;
        }
      `}</style>
    </div>
  );
};

export default TaskDetails;
