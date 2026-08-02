import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, X, Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import Navbg from "../assets/navbg.png";

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { unreadCount } = useSocket();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
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

  const isAdmin = user?.role === 'admin';

  return (
    <header
  className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800/80 px-4 backdrop-blur-md sm:px-6 lg:px-8"
  style={{
    backgroundImage: `url(${Navbg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
      {/* Left Section: Sidebar Toggle & Branding */}
      <div className="flex items-center gap-3">
        {/* Toggle Button - Visible below lg screen size */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-all duration-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white active:scale-95"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Title / Logo Area */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-slate-100 sm:text-lg">
              TaskSphere <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent font-bold">Portal</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Right Section: User Role Badge & Notification Bell */}
      <div className="flex items-center gap-3">
        {/* Beautiful User Role Badge */}
        {user && (
          <div className={`hidden sm:flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm transition-all duration-300 ${isAdmin
              ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-indigo-500/5'
              : 'border-slate-800 bg-slate-900/60 text-slate-300'
            }`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${isAdmin ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
              }`}>
              {isAdmin ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 leading-none">Role</span>
              <span className="text-xs font-bold capitalize leading-tight">
                {user.role || (isAdmin ? 'Administrator' : 'Team Member')}
              </span>
            </div>
          </div>
        )}

        {/* Notification Bell & Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            aria-label="View Notifications"
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${showNotifications
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200'
              }`}
          >
            <Bell size={19} className="transition-transform duration-200 group-hover:rotate-12" />

            {/* Badge Glow & Indicator */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                {/* Pulsing Backlight */}
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75"></span>

                {/* Badge Content */}
                <span className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-1 text-[10px] font-extrabold text-white shadow-md shadow-rose-950/80 ring-2 ring-slate-950">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          {/* Dropdown Container */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 p-1 shadow-2xl shadow-slate-950/80 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <NotificationCenter onClose={() => setShowNotifications(false)} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;