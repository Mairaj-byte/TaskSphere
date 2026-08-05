import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from 'react-router-dom';
import { useSocket } from "../context/SocketContext";
import {
  LayoutDashboard,
  CheckSquare,
  ChevronRight,
  UserCircle,
  UsersRound,
  LogOut,
  Search,
  Clock,
  FolderKanban,
  Layers,
  MessageSquare,
  Megaphone,
  Settings,
  ClipboardCheck
} from "lucide-react";
import { API_BASE, useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout, token } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({
    dashboard: 0,
    tasks: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    productivity: 0,
  });
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const handleCronTrigger = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/test-cron`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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

   const fetchSidebarStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/tasks/sidebar-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setStats({
          dashboard: data.total || 0,
          tasks: data.total || 0,
          completed: data.completed || 0,
          pending: data.pending || 0,
          overdue: data.overdue || 0,
          productivity: data.productivity || 0,
        });
      } catch (err) {
        console.error(err);
      }
    };

   React.useEffect(() => {
    if (token) fetchSidebarStats();
   }, [token]);

  const fetchPendingApprovalsCount = async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await fetch(
        `${API_BASE}/tasks?status=${encodeURIComponent('Completed (Pending Approval)')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setPendingApprovals(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchPendingApprovalsCount();
    }
  }, [token, user?.role]);

  React.useEffect(() => {
    if (!socket) return;
    socket.on("taskUpdated", fetchSidebarStats);
    socket.on("taskUpdated", fetchPendingApprovalsCount);
    socket.on("projectUpdated", fetchPendingApprovalsCount); // Listen for project approvals too
    return () => {
        socket.off("taskUpdated", fetchSidebarStats);
        socket.off("taskUpdated", fetchPendingApprovalsCount);
        socket.off("projectUpdated", fetchPendingApprovalsCount);
    };
  }, [socket, user?.role]);
  
  const profilePhotoUrl = user?.profilePhoto
    ? (user.profilePhoto.startsWith('http') 
        ? user.profilePhoto 
        : `${API_BASE.replace(/\/api$/, '')}${user.profilePhoto}`)
    : null;

  return (
    <aside className="
      flex h-screen w-full flex-col
      border-r border-[#2A3556]
      bg-[#16213E]
      text-[#F4F1EB]
      p-5
      overflow-y-auto
      shadow-[8px_0_30px_rgba(0,0,0,.35)]
      [&::-webkit-scrollbar]:hidden
      [-ms-overflow-style:none]
      [scrollbar-width:none]
      "
    >
      <div className="flex-1 space-y-6">
        <div className="rounded-2xl border border-[#31436A] bg-[#1D2951] p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DC9750] text-[#F4F1EB] shadow-lg">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F7F3ED]">TaskSphere</h2>
              <p className="text-xs text-[#C9C2B8]">Team Workspace</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#243457] px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-300">Workspace Online</span>
            </div>
            <span className="text-xs font-semibold text-[#DC9750]">v1.0</span>
          </div>
        </div>

        <div className="relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#DC9750]" />
          <input
            type="text"
            placeholder="Search..."
            className="py-3 pl-11 pr-16 w-full rounded-xl border border-[#31436A] bg-[#1D2951] text-[#F4F1EB] placeholder:text-[#BEB5A8] focus:border-[#DC9750] transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-[#31436A] px-2 py-1 text-[10px] text-[#C9C2B8]">Ctrl K</span>
        </div>

        <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-widest text-[#C9C2B8]">
          Workspace
        </p>

        <nav className="flex flex-col gap-1.5">
          <NavLink
            to="/"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive ? `bg-[#DC9750]/18 border-l-4 border-[#DC9750] text-[#F4F1EB] shadow-[0_8px_24px_rgba(220,151,80,.15)] backdrop-blur-md`
                         : `text-[#C9C2B8] hover:bg-[#223154] hover:text-[#F4F1EB] hover:translate-x-1 hover:shadow-md`
              }`
            }
          >
            <LayoutDashboard size={18} />
            <div className="flex w-full items-center justify-between">
              <span>Dashboard</span>
              <span className="rounded-full bg-[#DC9750] px-2 py-0.5 text-[10px] font-semibold text-[#F4F1EB]">{stats.dashboard}</span>
            </div>
          </NavLink>

          <NavLink
            to="/chat"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive ? `bg-[#DC9750]/18 border-l-4 border-[#DC9750] text-[#F4F1EB] shadow-[0_8px_24px_rgba(220,151,80,.15)] backdrop-blur-md`
                         : `text-[#C9C2B8] hover:bg-[#223154] hover:text-[#F4F1EB] hover:translate-x-1 hover:shadow-md`
              }`
            }
          >
           <MessageSquare size={19} />
           <span>Discussion</span>
          </NavLink>

          <NavLink
            to="/announcements"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive ? `bg-[#DC9750]/18 border-l-4 border-[#DC9750] text-[#F4F1EB] shadow-[0_8px_24px_rgba(220,151,80,.15)] backdrop-blur-md`
                         : `text-[#C9C2B8] hover:bg-[#223154] hover:text-[#F4F1EB] hover:translate-x-1 hover:shadow-md`
              }`
            }
          >
            <Megaphone size={18} />
            <span>Announcements</span>
          </NavLink>

          <NavLink
            to="/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive ? `bg-[#DC9750]/18 border-l-4 border-[#DC9750] text-[#F4F1EB] shadow-[0_8px_24px_rgba(220,151,80,.15)] backdrop-blur-md`
                         : `text-[#C9C2B8] hover:bg-[#223154] hover:text-[#F4F1EB] hover:translate-x-1 hover:shadow-md`
              }`
            }
          >
            <UserCircle size={18} />
            <span>My Profile</span>
          </NavLink>

          <NavLink
            to="/groups"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive ? `bg-[#DC9750]/18 border-l-4 border-[#DC9750] text-[#F4F1EB] shadow-[0_8px_24px_rgba(220,151,80,.15)] backdrop-blur-md`
                         : `text-[#C9C2B8] hover:bg-[#223154] hover:text-[#F4F1EB] hover:translate-x-1 hover:shadow-md`
              }`
            }
          >
            <FolderKanban size={18} />
            <span>Projects</span>
          </NavLink>

          {/* APPROVALS MOVED HERE: Below Projects, Above Tasks */}
          {user?.role === 'admin' && (
            <NavLink
              to="/approvals"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isActive ? `bg-indigo-500/20 text-white border-l-4 border-indigo-500`
                           : `text-gray-400 hover:bg-white/10 hover:translate-x-1 hover:text-white`
                }`
              }
            >
              <ClipboardCheck size={18} />
              <div className="flex w-full items-center justify-between">
                <span>Approvals</span>
                {pendingApprovals > 0 && (
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {pendingApprovals}
                  </span>
                )}
              </div>
            </NavLink>
          )}

          <NavLink
            to="/tasks"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive ? `bg-[#DC9750]/18 border-l-4 border-[#DC9750] text-[#F4F1EB] shadow-[0_8px_24px_rgba(220,151,80,.15)] backdrop-blur-md`
                         : `text-[#C9C2B8] hover:bg-[#223154] hover:text-[#F4F1EB] hover:translate-x-1 hover:shadow-md`
              }`
            }
          >
            <CheckSquare size={18} />
            <div className="flex w-full items-center justify-between">
              <span>Tasks</span>
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-[#F4F1EB]">
                {stats.tasks}
              </span>
            </div>
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink
              to="/users"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isActive ? `bg-[#DC9750]/18 border-l-4 border-[#DC9750] text-[#F4F1EB] shadow-[0_8px_24px_rgba(220,151,80,.15)] backdrop-blur-md`
                           : `text-[#C9C2B8] hover:bg-[#223154] hover:text-[#F4F1EB] hover:translate-x-1 hover:shadow-md`
                }`
              }
            >
             <UsersRound size={18} />
             Manage Team
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <NavLink
              to="/settings"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isActive ? `bg-[#DC9750]/18 border-l-4 border-[#DC9750] text-[#F4F1EB] shadow-[0_8px_24px_rgba(220,151,80,.15)] backdrop-blur-md`
                           : `text-[#C9C2B8] hover:bg-[#223154] hover:text-[#F4F1EB] hover:translate-x-1 hover:shadow-md`
                }`
              }
            >
              <Settings size={18} />
              Admin Settings
            </NavLink>
          )}
          
        </nav>
      </div>

      <div className="mt-auto space-y-4 border-t border-[#31436A] pt-4">
        {user?.role === 'admin' && (
          <button
            onClick={handleCronTrigger}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#DC9750]/30 bg-[#DC9750]/10 py-2 text-xs font-semibold text-[#DC9750] hover:bg-[#DC9750]/20"
          >
            <Clock size={15} />
            Run Due Check
          </button>
        )}

        <div className="rounded-2xl border border-[#31436A] bg-[#1D2951] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#F4F1EB]">
            Today's Summary
          </h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => { handleNavClick(); navigate('/tasks?status=Approved'); }}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[#223154]"
            >
              <span className="text-[#C9C2B8]">Completed</span>
              <span className="text-green-400">{stats.completed}</span>
            </button>
            <button
              type="button"
              onClick={() => { handleNavClick(); navigate('/tasks?status=pending'); }}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[#223154]"
            >
              <span className="text-[#C9C2B8]">Pending</span>
              <span className="text-yellow-400">{stats.pending}</span>
            </button>
            <button
              type="button"
              onClick={() => { handleNavClick(); navigate('/tasks?status=Overdue'); }}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[#223154]"
            >
              <span className="text-[#C9C2B8]">Overdue</span>
              <span className="text-red-400">{stats.overdue}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { handleNavClick(); navigate('/tasks?status=Approved'); }}
          className="w-full rounded-2xl border border-[#31436A] bg-[#1D2951] p-4 text-left transition-colors hover:bg-[#223154]"
        >
          <h3 className="text-sm font-semibold text-[#F4F1EB]">Productivity</h3>
          <div className="mt-4 h-3 rounded-full bg-gray-700">
            <div
            className="h-3 rounded-full bg-gradient-to-r from-[#C78645] via-[#DC9750] to-[#F2C27D] shadow-[0_0_12px_rgba(220,151,80,0.45)] transition-all duration-700"
            style={{ width: `${stats.productivity}%` }}
          ></div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[#C9C2B8]">Task Completion</p>
            <p className="text-xs font-semibold text-[#DC9750]">{stats.productivity}%</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[#31436A] bg-[#1D2951] p-3 transition-all duration-300 hover:border-[#DC9750] hover:bg-[#223154] hover:shadow-lg hover:shadow-[#DC9750]/20"
        >
          <div className="flex items-center gap-3 min-w-0">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={user?.name || "User"}
                className="h-14 w-14 rounded-full border-2 border-[#DC9750] object-cover shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}

            <div
              className={`h-14 w-14 items-center justify-center rounded-full bg-[#DC9750] text-xl font-bold text-[#F4F1EB] shadow-md ${
                profilePhotoUrl ? 'hidden' : 'flex'
              }`}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <h3 className="truncate text-sm font-bold text-[#F4F1EB]">{user?.name}</h3>
              <p className="truncate text-xs text-[#DC9750]">
                {user?.designationRole || (user?.role === "admin" ? "Administrator" : "Team Member")}
              </p>
              {user?.department && (
                <p className="truncate text-[11px] text-[#C9C2B8]">{user.department}</p>
              )}
              {user?.employeeId && (
                <p className="truncate text-[10px] text-[#C9C2B8]">ID: {user.employeeId}</p>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="text-[#C9C2B8] transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
        </button>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#C9C2B8] hover:bg-[#DC9750]/10 hover:text-[#DC9750] transition-all duration-300"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;