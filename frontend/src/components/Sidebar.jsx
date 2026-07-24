import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, LogOut, Clock, Layers, User } from 'lucide-react';
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

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && toggleSidebar) {
      toggleSidebar();
    }
  };

  return (
    <aside className="flex h-screen w-full flex-col justify-between overflow-hidden border-r border-white/10 bg-[#0a0f1e]/95 p-5 text-gray-200 backdrop-blur-xl select-none">
      {/* Top Section: Brand & Navigation */}
      <div className="flex flex-col gap-6 overflow-hidden">
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <Layers size={22} />
          </div>
          <h2 className="font-heading text-xl font-extrabold tracking-wide bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            TaskSphere
          </h2>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 overflow-y-auto">
          <NavLink
            to="/"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'border-l-3 border-indigo-500 bg-gradient-to-r from-indigo-500/20 to-transparent text-white shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
              }`
            }
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'border-l-3 border-indigo-500 bg-gradient-to-r from-indigo-500/20 to-transparent text-white shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
              }`
            }
          >
            <User size={19} />
            <span>My Profile </span>
          </NavLink>

          <NavLink
            to="/tasks"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'border-l-3 border-indigo-500 bg-gradient-to-r from-indigo-500/20 to-transparent text-white shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
              }`
            }
          >
            <CheckSquare size={19} />
            <span>Tasks</span>
          </NavLink>

          {user && user.role === 'admin' && (
            <NavLink
              to="/users"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border-l-3 border-indigo-500 bg-gradient-to-r from-indigo-500/20 to-transparent text-white shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
                }`
              }
            >
              <Users size={19} />
              <span>Manage Team</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* Bottom Section: Actions & User Info */}
      <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
        {/* Admin Run Due Check Button */}
        {user && user.role === 'admin' && (
          <button
            onClick={handleCronTrigger}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20 hover:border-indigo-500/50 active:scale-98 cursor-pointer"
          >
            <Clock size={15} />
            <span>Run Due Check</span>
          </button>
        )}

        {/* User Card */}
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 border border-white/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
            <p className="truncate text-[11px] text-gray-400">
              {user?.role === 'admin' ? 'Manager' : 'Team Member'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;