import React, { useEffect, useState } from "react";
import {
  Search,
  Trash2,
  LogIn,
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLoginActivityApi } from "../services/loginActivityApi";
import { useAuth } from "../context/AuthContext";

const LoginActivity = () => {
  const { user } = useAuth();
  const { getLoginActivities, getMyLoginActivities, clearLoginActivities } = useLoginActivityApi();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadActivities = async () => {
    try {
      setLoading(true);
      let res;

      // Admin/Manager fetches all logs; regular members fetch their own
      if (user?.role === "admin" || user?.role === "manager") {
        res = await getLoginActivities(1, 100, search, action);
      } else {
        res = await getMyLoginActivities();
      }

      setActivities(res.data || []);
      setCurrentPage(1); // Reset to first page on new data fetch/filter
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    loadActivities();
  };

  const handleClear = async () => {
    const ok = window.confirm("Delete all login activity?");

    if (!ok) return;

    try {
      await clearLoginActivities();
      loadActivities();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Pagination Logic ---
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentActivities = activities.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1426]/70 p-3 sm:p-6 backdrop-blur-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-base sm:text-lg font-semibold text-white">
            Login Activity Logs
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Monitor authentication history and active session records.
          </p>
        </div>

        <button
          onClick={handleClear}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs sm:text-sm font-medium transition-all w-full sm:w-auto"
        >
          <Trash2 size={16} />
          Clear Activity
        </button>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:grid sm:grid-cols-12 gap-2.5">
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            placeholder="Search by user or email..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sm:col-span-3">
          <select
            className="w-full rounded-xl border border-white/10 bg-[#0d1426] px-3 py-2.5 text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition"
          >
            <Search size={16} />
            Filter
          </button>
        </div>
      </form>

      {/* Desktop / Laptop View Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 text-gray-400 border-b border-white/10 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Provider</th>
              <th className="p-3.5">IP Address</th>
              <th className="p-3.5">Login Time</th>
              <th className="p-3.5">Logout Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 text-gray-300">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-indigo-400" size={24} />
                </td>
              </tr>
            ) : currentActivities.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No activity history found.
                </td>
              </tr>
            ) : (
              currentActivities.map((item) => (
                <tr key={item._id} className="hover:bg-white/[0.02] transition">
                  <td className="p-3.5">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.email}</p>
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                        item.action === "login"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {item.action === "login" ? <LogIn size={13} /> : <LogOut size={13} />}
                      <span className="capitalize">{item.action}</span>
                    </span>
                  </td>

                  <td className="p-3.5 capitalize text-gray-400">{item.loginProvider || "Password"}</td>

                  <td className="p-3.5 font-mono text-gray-400">{item.ipAddress || "—"}</td>

                  <td className="p-3.5">
                    {item.loginTime ? new Date(item.loginTime).toLocaleString() : "—"}
                  </td>

                  <td className="p-3.5">
                    {item.logoutTime ? new Date(item.logoutTime).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fully Enhanced Mobile Card Layout */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="animate-spin mx-auto text-indigo-400" size={24} />
          </div>
        ) : currentActivities.length === 0 ? (
          <p className="text-center py-6 text-xs text-gray-500">No activity history found.</p>
        ) : (
          currentActivities.map((item) => (
            <div
              key={item._id}
              className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.email}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                    item.action === "login"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {item.action === "login" ? <LogIn size={12} /> : <LogOut size={12} />}
                  <span className="capitalize">{item.action}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                <div>
                  <span className="block text-[10px] text-gray-500">IP Address</span>
                  <span className="font-mono text-gray-300">{item.ipAddress || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500">Provider</span>
                  <span className="text-gray-300 capitalize">{item.loginProvider || "Password"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                <div>
                  <span className="block text-[10px] text-gray-500">Login Time</span>
                  <span className="text-gray-300">
                    {item.loginTime ? new Date(item.loginTime).toLocaleString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500">Logout Time</span>
                  <span className="text-gray-300">
                    {item.logoutTime ? new Date(item.logoutTime).toLocaleString() : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && activities.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs text-gray-400">
          <div className="text-center sm:text-left">
            Showing <span className="text-white font-medium">{startIndex + 1}</span> to{" "}
            <span className="text-white font-medium">
              {Math.min(startIndex + itemsPerPage, activities.length)}
            </span>{" "}
            of <span className="text-white font-medium">{activities.length}</span> entries
          </div>

          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition text-white shrink-0"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition shrink-0 ${
                  currentPage === page
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-300"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition text-white shrink-0"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginActivity;