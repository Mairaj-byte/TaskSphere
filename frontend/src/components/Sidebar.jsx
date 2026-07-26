import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  ChevronRight,
  Users,
  UserCircle,
  LogOut,
  Search,
  Clock,
<<<<<<< HEAD
  FolderKanban,
  Layers
} from "lucide-react";
import { API_BASE, useAuth } from "../context/AuthContext";
=======
  Layers,
  User,
} from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';
>>>>>>> 6c8076ce66690bea01249adcb65967afcc9f7c07

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({
  dashboard: 0,
  tasks: 0,
});
  console.log("User Object:", user);
  console.log("Profile Photo:", user?.profilePhoto);

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

     React.useEffect(() => {
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
        dashboard: data.dashboardCount || 0,
        tasks: data.taskCount || 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (token) {
    fetchSidebarStats();
  }
}, [token]);

  return (
    <aside className="flex h-screen w-full flex-col border-r border-white/10 bg-[#0a0f1e]/95 p-5 text-gray-200 backdrop-blur-xl overflow-y-auto">

      {/* ================= TOP ================= */}

      <div className="flex-1 space-y-6">

        {/* ================= WORKSPACE HEADER ================= */}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
              <Layers size={24} />
            </div>

            <div>

              <h2 className="text-xl font-bold text-white">
                TaskSphere
              </h2>

              <p className="text-xs text-gray-400">
                Team Workspace
              </p>

            </div>

          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-black/20 px-3 py-2">

            <div className="flex items-center gap-2">

              <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>

              <span className="text-xs text-gray-300">
                Workspace Online
              </span>

            </div>

            <span className="text-xs text-indigo-300">
              v1.0
            </span>

          </div>

        </div>


        {/* ================= SEARCH ================= */}

        <div className="relative">

          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-16 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-indigo-500"
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-white/10 px-2 py-1 text-[10px] text-gray-400">
            Ctrl K
          </span>

        </div>


        {/* Navigation */}

        <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
          Workspace
        </p>

        <nav className="flex flex-col gap-1.5">

          <NavLink
            to="/"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-500/20 text-white border-l-4 border-indigo-500'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white hover:translate-x-1'
              }`
            }
          >
            <LayoutDashboard size={18} />

            <div className="flex w-full items-center justify-between">
              <span>Dashboard</span>

<<<<<<< HEAD
    <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white">
  {stats.dashboard}
</span>
  </div>
</NavLink>
=======
              <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                4
              </span>
            </div>
          </NavLink>
>>>>>>> 6c8076ce66690bea01249adcb65967afcc9f7c07

          <NavLink
            to="/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-500/20 text-white border-l-4 border-indigo-500'
                  : 'text-gray-400 hover:bg-white/10 hover:translate-x-1 hover:text-white'
              }`
            }
          >
<<<<<<< HEAD
           <UserCircle size={18} />
<span>My Profile</span>
          </NavLink>

          <NavLink
            to="/groups"
=======
            <User size={19} />
            <span>My Profile</span>
          </NavLink>

          <NavLink
            to="/tasks"
>>>>>>> 6c8076ce66690bea01249adcb65967afcc9f7c07
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-500/20 text-white border-l-4 border-indigo-500'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white hover:translate-x-1'
              }`
            }
          >
<<<<<<< HEAD
            <FolderKanban size={18} />
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/tasks"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-500/20 text-white border-l-4 border-indigo-500'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white hover:translate-x-1'
              }`
            }
          >
             

            <CheckSquare size={18} />
            <div className="flex w-full items-center justify-between">
              <span>Tasks</span>
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
               {stats.tasks}
=======
            <CheckSquare size={18} />

            <div className="flex w-full items-center justify-between">
              <span>Tasks</span>

              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                12
>>>>>>> 6c8076ce66690bea01249adcb65967afcc9f7c07
              </span>
            </div>
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink
              to="/users"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-500/20 text-white border-l-4 border-indigo-500'
                    : 'text-gray-400 hover:bg-white/10 hover:translate-x-1 hover:text-white'
                }`
              }
            >
              <Users size={18} />
              Manage Team
            </NavLink>
          )}

        </nav>

      </div>

      {/* ================= BOTTOM ================= */}

      <div className="mt-auto space-y-4 border-t border-white/10 pt-4">

        {/* Admin Button */}

        {user?.role === 'admin' && (
          <button
            onClick={handleCronTrigger}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20"
          >
            <Clock size={15} />
            Run Due Check
          </button>
        )}
        

        {/* ================= TODAY'S SUMMARY ================= */}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

          <h3 className="mb-3 text-sm font-semibold text-white">
            Today's Summary
          </h3>

          <div className="space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-400">Completed</span>
              <span className="text-green-400">18</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Pending</span>
              <span className="text-yellow-400">6</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Overdue</span>
              <span className="text-red-400">2</span>
            </div>

          </div>

        </div>


        {/* ================= PRODUCTIVITY ================= */}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

          <h3 className="text-sm font-semibold text-white">
            Productivity
          </h3>

          <div className="mt-4 h-3 rounded-full bg-gray-700">

            <div
              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
              style={{ width: "72%" }}
            ></div>

          </div>

          <div className="mt-3 flex items-center justify-between">

            <p className="text-xs text-gray-400">
              Task Completion
            </p>

            <p className="text-xs font-semibold text-indigo-300">
              72%
            </p>

          </div>

        </div>


        {/* USER CARD */}

        <button
          onClick={() => navigate("/profile")}
          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-300 hover:border-indigo-500 hover:bg-white/10 hover:shadow-lg hover:shadow-indigo-500/20"
        >

          {/* Profile Picture */}

          {user?.profilePhoto ? (
<<<<<<< HEAD
 <img
  src={user.profilePhoto}
  alt={user.name}
  className="h-14 w-14 rounded-full object-cover"
/>
) : (
  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-xl font-bold text-white shadow-md">
    {user?.name?.charAt(0).toUpperCase() || "U"}
  </div>
)}
=======
            <img
              src={`${API_BASE}${user.profilePhoto}`}
              alt={user.name}
              className="h-14 w-14 rounded-full border-2 border-indigo-500 object-cover shadow-md"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-xl font-bold text-white shadow-md">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
>>>>>>> 6c8076ce66690bea01249adcb65967afcc9f7c07

          {/* User Info */}

          <div className="min-w-0 flex-1 text-left">

            <h3 className="truncate text-sm font-bold text-white">
              {user?.name}
            </h3>

            <p className="truncate text-xs text-indigo-300">
              {user?.designationRole ||
                (user?.role === "admin"
                  ? "Administrator"
                  : "Team Member")}
            </p>

            {user?.department && (
              <p className="truncate text-[11px] text-gray-400">
                {user.department}
              </p>
            )}

            {user?.employeeId && (
              <p className="truncate text-[10px] text-gray-500">
                ID: {user.employeeId}
              </p>
            )}

          </div>

<<<<<<< HEAD
        <ChevronRight
  size={18}
  className="text-gray-500 transition-transform duration-300 group-hover:translate-x-1"
/>
</button>
=======
          <ChevronRight
            size={18}
            className="text-gray-500 transition-transform duration-300 group-hover:translate-x-1"
          />

        </button>
>>>>>>> 6c8076ce66690bea01249adcb65967afcc9f7c07

        {/* Logout */}

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>

    </aside>
  );
};

export default Sidebar;