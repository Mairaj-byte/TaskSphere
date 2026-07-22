import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, LogOut, Clock, Layers } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout, token } = useAuth();

  const handleCronTrigger = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/test-cron`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Cron reminder and overdue system processed successfully!');
      } else {
        alert('Failed to trigger scheduler.');
      }
    } catch (err) {
      alert('Error triggering scheduler: ' + err.message);
    }
  };

  return (
    <aside className={`sidebar glass-card ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <Layers className="brand-icon" size={24} />
        <h2>TaskSphere</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={() => window.innerWidth < 992 && toggleSidebar()}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={() => window.innerWidth < 992 && toggleSidebar()}
        >
          <CheckSquare size={20} />
          <span>Tasks</span>
        </NavLink>

        {user && user.role === 'admin' && (
          <NavLink 
            to="/users" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => window.innerWidth < 992 && toggleSidebar()}
          >
            <Users size={20} />
            <span>Manage Team</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        {user && user.role === 'admin' && (
          <button onClick={handleCronTrigger} className="btn-cron-trigger btn btn-secondary">
            <Clock size={16} />
            <span>Run Due Check</span>
          </button>
        )}

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{user?.role === 'admin' ? 'Manager' : 'Team Member'}</p>
          </div>
        </div>

        <button onClick={logout} className="logout-btn nav-link">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          display: flex;
          flex-direction: column;
          border-radius: 0;
          border-right: 1px solid var(--border-glass);
          border-top: none;
          border-bottom: none;
          border-left: none;
          padding: 1.5rem;
          background: rgba(10, 15, 30, 0.95);
          transition: transform var(--transition-normal);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
          padding-left: 0.5rem;
        }

        .brand-icon {
          color: var(--color-primary);
        }

        .sidebar-brand h2 {
          font-size: 1.25rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--text-main), var(--color-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-radius: var(--border-radius-sm);
          color: var(--text-muted);
          font-weight: 500;
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--text-main);
          background: rgba(99, 102, 241, 0.1);
        }

        .nav-link.active {
          border-left: 3px solid var(--color-primary);
          padding-left: calc(1rem - 3px);
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.15), transparent);
        }

        .sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-top: 1px solid var(--border-glass);
          padding-top: 1.5rem;
        }

        .btn-cron-trigger {
          width: 100%;
          justify-content: center;
          font-size: 0.8rem;
          padding: 0.5rem;
          border-color: rgba(99, 102, 241, 0.3);
        }

        .btn-cron-trigger:hover {
          border-color: var(--color-primary);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .logout-btn {
          margin-top: 0.5rem;
          border: none;
          background: none;
          text-align: left;
          width: 100%;
        }

        .logout-btn:hover {
          color: var(--color-rejected);
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
