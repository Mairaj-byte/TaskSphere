import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import NotificationCenter from './NotificationCenter';

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { unreadCount } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="navbar glass-card">
      <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="navbar-title">
        <h3>Task Tracker Portal</h3>
      </div>

      <div className="navbar-actions" ref={notificationRef}>
        <button className="notification-bell-btn" onClick={toggleNotifications}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="bell-badge-glow">
              <span className="bell-badge">{unreadCount}</span>
            </span>
          )}
        </button>

        {showNotifications && (
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        )}
      </div>

      <style>{`
        .navbar {
          height: var(--navbar-height);
          width: 100%;
          border-radius: 0;
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid var(--border-glass);
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(7, 10, 19, 0.85);
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .sidebar-toggle-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-main);
          cursor: pointer;
        }

        .navbar-title h3 {
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--text-main);
        }

        .navbar-actions {
          position: relative;
        }

        .notification-bell-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          width: 40px;
          height: 40px;
          border-radius: var(--border-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .notification-bell-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .bell-badge-glow {
          position: absolute;
          top: -4px;
          right: -4px;
          display: flex;
          height: 18px;
          width: 18px;
        }

        .bell-badge {
          background: linear-gradient(135deg, var(--color-rejected), #b91c1c);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
        }

        @media (max-width: 992px) {
          .sidebar-toggle-btn {
            display: flex;
          }
          .navbar {
            padding: 0 1rem;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
