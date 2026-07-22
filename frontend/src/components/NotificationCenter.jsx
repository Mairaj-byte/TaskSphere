import React from 'react';
import { Check, Trash2, BellOff, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const NotificationCenter = ({ onClose }) => {
  const {
    notifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAllNotifications
  } = useSocket();

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'assignment': return 'notif-assignment';
      case 'approval': return 'notif-approval';
      case 'rejection': return 'notif-rejection';
      case 'overdue': return 'notif-overdue';
      case 'completed': return 'notif-completed';
      default: return 'notif-default';
    }
  };

  return (
    <div className="notif-center glass-card">
      <div className="notif-header">
        <div className="notif-title-section">
          <h4>Notifications</h4>
          <button className="notif-close-mobile" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {notifications.length > 0 && (
          <button className="btn-text" onClick={markAllAsRead}>
            <Check size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="notif-body">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <BellOff size={32} className="notif-empty-icon" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`notif-item ${!notif.read ? 'unread' : ''}`}
                onClick={() => !notif.read && markAsRead(notif._id)}
              >
                <div className="notif-item-header">
                  <span className={`notif-indicator ${getBadgeClass(notif.type)}`}>
                    {notif.type}
                  </span>
                  <span className="notif-time">{formatTime(notif.createdAt)}</span>
                </div>
                <p className="notif-message">{notif.message}</p>
                <button 
                  className="notif-delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation(); // prevent markAsRead trigger
                    deleteNotification(notif._id);
                  }}
                  title="Delete notification"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notif-footer">
          <button className="btn-text btn-clear-all" onClick={clearAllNotifications}>
            <Trash2 size={14} />
            <span>Clear all</span>
          </button>
        </div>
      )}

      <style>{`
        .notif-center {
          position: absolute;
          top: 50px;
          right: 0;
          width: 360px;
          max-height: 485px;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          border-radius: var(--border-radius-md);
          overflow: hidden;
          background: rgba(13, 20, 38, 0.98);
          border: 1px solid var(--border-glass);
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }

        .notif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border-glass);
        }

        .notif-title-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .notif-close-mobile {
          display: none;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .notif-header h4 {
          font-size: 1rem;
          font-weight: 700;
        }

        .btn-text {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        .btn-text:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .notif-body {
          flex: 1;
          overflow-y: auto;
          max-height: 380px;
        }

        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          color: var(--text-muted);
          gap: 0.75rem;
        }

        .notif-empty-icon {
          opacity: 0.3;
        }

        .notif-list {
          display: flex;
          flex-direction: column;
        }

        .notif-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border-glass);
          cursor: pointer;
          transition: background-color var(--transition-fast);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .notif-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .notif-item.unread {
          background: rgba(99, 102, 241, 0.05);
        }

        .notif-item.unread::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 8px var(--color-primary);
        }

        .notif-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notif-indicator {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }

        .notif-assignment { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
        .notif-approval { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .notif-rejection { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .notif-overdue { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
        .notif-completed { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .notif-default { background: rgba(139, 155, 180, 0.15); color: #9ca3af; }

        .notif-time {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .notif-message {
          font-size: 0.8rem;
          line-height: 1.4;
          color: var(--text-main);
          padding-right: 1.5rem;
        }

        .notif-delete-btn {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          opacity: 0;
          transition: opacity var(--transition-fast), color var(--transition-fast);
        }

        .notif-item:hover .notif-delete-btn {
          opacity: 1;
        }

        .notif-delete-btn:hover {
          color: var(--color-rejected);
        }

        .notif-footer {
          border-top: 1px solid var(--border-glass);
          padding: 0.75rem 1rem;
          display: flex;
          justify-content: center;
          background: rgba(10, 15, 30, 0.9);
        }

        .btn-clear-all {
          color: var(--text-muted);
        }
        .btn-clear-all:hover {
          color: var(--color-rejected);
        }

        @media (max-width: 992px) {
          .notif-center {
            position: fixed;
            top: var(--navbar-height);
            left: 0;
            right: 0;
            width: 100%;
            height: calc(100vh - var(--navbar-height));
            max-height: none;
            border-radius: 0;
            border-left: none;
            border-right: none;
            border-bottom: none;
          }
          .notif-body {
            max-height: none;
          }
          .notif-close-mobile {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;
