import React, { useState } from 'react';
import { Outlet, Navigate, useLocation} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Wait for session verification
  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-gray-400">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-white/10 border-t-indigo-500"></div>
        <p className="text-sm font-medium">Loading TaskSphere...</p>
      </div>
    );
  }

  // Redirect to login if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    /* h-screen + overflow-hidden pins the main app viewport */
    <div className="flex h-screen w-full overflow-hidden bg-[#070a13] text-gray-100">
      {/* Sidebar - Sticky on desktop, Fixed drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 shrink-0 transform bg-[#0d1426] transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </aside>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content Area - Only this container handles scrolling */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main
          className={`flex-1 overflow-y-auto ${
            location.pathname === "/chat"
              ? "p-0"
              : "p-4 md:p-6 lg:p-8"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;