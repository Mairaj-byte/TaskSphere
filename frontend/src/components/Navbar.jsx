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
  className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#1e2640]/80 px-4 backdrop-blur-md sm:px-6 lg:px-8"
  style={{
    // backgroundImage: `url(${Navbg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundColor: "rgba(13, 16, 28, 0.85)", // #1e2640 fallback ground
  }}
>
  {/* Left Section: Sidebar Toggle & Branding */}
  <div className="flex items-center gap-3">
    {/* Toggle Button - Visible below lg screen size */}
    <button
      onClick={toggleSidebar}
      aria-label="Toggle Sidebar"
      className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e2640] bg-[#1e2640]/60 text-slate-300 transition-colors duration-200 hover:border-[#dc9750]/50 hover:bg-[#1e2640] hover:text-[#dc9750] active:scale-95"
    >
      {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
    </button>

    {/* Title / Logo Area */}
    <div className="flex items-center gap-2.5">
      <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-[#dc9750] text-[#1e2640] shadow-sm">
        <Sparkles size={16} className="fill-[#1e2640]/20" />
      </div>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-slate-100 sm:text-lg">
          TaskSphere <span className="text-[#dc9750] font-bold">Portal</span>
        </h3>
      </div>
    </div>
  </div>

  {/* Right Section: User Role Badge & Notification Bell */}
  <div className="flex items-center gap-3">
    {/* User Role Badge */}
    {user && (
      <div
        className={`hidden sm:flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm transition-all duration-200 ${
          isAdmin
            ? "border-[#dc9750]/40 bg-[#dc9750]/10 text-[#dc9750]"
            : "border-[#1e2640] bg-[#1e2640]/80 text-slate-300"
        }`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-lg ${
            isAdmin ? "bg-[#dc9750]/20 text-[#dc9750]" : "bg-[#1e2640] text-slate-400"
          }`}
        >
          {isAdmin ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
        </span>
        <div className="flex flex-col text-left">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 leading-none">
            Role
          </span>
          <span className="text-xs font-bold capitalize leading-tight">
            {user.role || (isAdmin ? "Administrator" : "Team Member")}
          </span>
        </div>
      </div>
    )}

    {/* Notification Bell & Dropdown */}
    <div className="relative" ref={notificationRef}>
      <button
        onClick={toggleNotifications}
        aria-label="View Notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-200 active:scale-95 ${
          showNotifications
            ? "border-[#dc9750] bg-[#1e2640] text-[#dc9750]"
            : "border-[#1e2640] bg-[#1e2640]/60 text-slate-300 hover:border-[#dc9750]/50 hover:bg-[#1e2640] hover:text-[#dc9750]"
        }`}
      >
        <Bell size={19} />

        {/* Badge Indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#dc9750] opacity-50"></span>
            <span className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc9750] px-1 text-[10px] font-extrabold text-[#1e2640] ring-2 ring-[#1e2640]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {showNotifications && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-[#1e2640] bg-[#1e2640]/95 p-1 shadow-xl shadow-black/40 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        </div>
      )}
    </div>
  </div>
</header>
  );
};

export default Navbar;