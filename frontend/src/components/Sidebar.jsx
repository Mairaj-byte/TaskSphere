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
  MessageSquare, // <--- ADDED THIS IMPORT
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

    if (token) {
      fetchSidebarStats();
    }

  }, [token]);

  // Admin-only: count of tasks waiting for approval, shown as a badge
  // next to the Approvals link.
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

    return () => {
      socket.off("taskUpdated", fetchSidebarStats);
      socket.off("taskUpdated", fetchPendingApprovalsCount);
    };

  }, [socket, user?.role]);


  // Cleaned up profile photo URL resolution
  const profilePhotoUrl = user?.profilePhoto
    ? (user.profilePhoto.startsWith('http')
      ? user.profilePhoto
      : `${API_BASE.replace(/\/api$/, '')}${user.profilePhoto}`)
    : null;

  return (
    <aside className="flex h-screen w-full flex-col  text-slate-200 border-r border-slate-800/80 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

      {/* ================= TOP ================= */}
      <div className="flex-1 space-y-6">

        {/* ================= WORKSPACE HEADER ================= */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dc9750] text-[#1e2640] font-bold">
              <Layers size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold tracking-tight text-white truncate">
                TaskSphere
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Team Workspace
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between rounded-lg bg-slate-900/80 px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-slate-300">
                Workspace Online
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-[#dc9750] bg-[#dc9750]/10 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>
        </div>

        {/* ================= SEARCH ================= */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2 pl-9 pr-14 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#dc9750] focus:outline-none transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* ================= NAVIGATION ================= */}
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="flex flex-col gap-1">
            {[
              { to: "/", icon: LayoutDashboard, label: "Dashboard", badge: stats.dashboard, badgeBg: "bg-[#dc9750]/15 text-[#dc9750]" },
              { to: "/chat", icon: MessageSquare, label: "Discussion" },
              { to: "/announcements", icon: Megaphone, label: "Announcements" },
              { to: "/profile", icon: UserCircle, label: "My Profile" },
              { to: "/groups", icon: FolderKanban, label: "Projects" },
              { to: "/tasks", icon: CheckSquare, label: "Tasks", badge: stats.tasks, badgeBg: "bg-rose-500/15 text-rose-400" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? "bg-[#dc9750]/10 text-[#dc9750]"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0 transition-colors" />
                  <div className="flex w-full items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${item.badgeBg}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </NavLink>
              );
            })}

            {/* Admin Section */}
            {user?.role === "admin" && (
              <>
                <div className="my-2 border-t border-slate-800/80" />
                <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Admin
                </p>

                <NavLink
                  to="/approvals"
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? "bg-[#dc9750]/10 text-[#dc9750]"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`
                  }
                >
                  <ClipboardCheck size={18} className="shrink-0" />
                  <div className="flex w-full items-center justify-between">
                    <span>Approvals</span>
                    {pendingApprovals > 0 && (
                      <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        {pendingApprovals}
                      </span>
                    )}
                  </div>
                </NavLink>

                <NavLink
                  to="/users"
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? "bg-[#dc9750]/10 text-[#dc9750]"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`
                  }
                >
                  <UsersRound size={18} className="shrink-0" />
                  Manage Team
                </NavLink>

                <NavLink
                  to="/settings"
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? "bg-[#dc9750]/10 text-[#dc9750]"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`
                  }
                >
                  <Settings size={18} className="shrink-0" />
                  Admin Settings
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* ================= BOTTOM ================= */}
      <div className="mt-6 space-y-3 border-t border-slate-800/80 pt-4">

        {/* Admin Trigger Button */}
        {user?.role === "admin" && (
          <button
            onClick={handleCronTrigger}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#dc9750]/30 bg-[#dc9750]/5 py-2 text-xs font-medium text-[#dc9750] hover:bg-[#dc9750]/10 transition-colors"
          >
            <Clock size={14} />
            Run Due Check
          </button>
        )}

        {/* TODAY'S SUMMARY */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today's Summary
          </h3>
          <div className="space-y-1 text-xs">
            <button
              type="button"
              onClick={() => {
                handleNavClick();
                navigate("/tasks?status=Approved");
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <span>Completed</span>
              <span className="font-mono font-medium text-emerald-400">{stats.completed}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleNavClick();
                navigate("/tasks?status=pending");
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <span>Pending</span>
              <span className="font-mono font-medium text-amber-400">{stats.pending}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleNavClick();
                navigate("/tasks?status=Overdue");
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1 text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <span>Overdue</span>
              <span className="font-mono font-medium text-rose-400">{stats.overdue}</span>
            </button>
          </div>
        </div>

        {/* PRODUCTIVITY METRIC */}
        <button
          type="button"
          onClick={() => {
            handleNavClick();
            navigate("/tasks?status=Approved");
          }}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-left hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Productivity
            </h3>
            <span className="text-xs font-mono font-semibold text-[#dc9750]">
              {stats.productivity}%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#dc9750] transition-all duration-500"
              style={{ width: `${stats.productivity}%` }}
            ></div>
          </div>
        </button>

        {/* USER CARD */}
        <button
          onClick={() => navigate("/profile")}
          className="group flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-2.5 hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={user?.name || "User"}
                className="h-9 w-9 rounded-lg border border-slate-700 object-cover shrink-0"
                // onError={(e) => {
                //   e.currentTarget.style.display = "none";
                //   if (e.currentTarget.nextElementSibling) {
                //     (e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex";
                //   }
                // }}
              />
            ) : null}

            <div
              className={`h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dc9750] text-sm font-bold text-[#1e2640] ${profilePhotoUrl ? "hidden" : "flex"
                }`}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="min-w-0 flex-1 text-left leading-tight">
              <h3 className="truncate text-xs font-semibold text-white">
                {user?.name}
              </h3>
              <p className="truncate text-[11px] text-[#dc9750] mt-0.5">
                {user?.designationRole ||
                  (user?.role === "admin" ? "Administrator" : "Team Member")}
              </p>
            </div>
          </div>

          <ChevronRight
            size={16}
            className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0"
          />
        </button>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>

      </div>
    </aside>
  );
};

export default Sidebar;