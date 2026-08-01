import React, { useEffect, useState, useMemo } from "react";
import { useAuth, API_BASE } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// --- Inline SVGs for zero extra dependencies ---
const PlusIcon = () => (
  <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4 text-slate-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4 text-slate-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FolderPlusIcon = () => (
  <svg className="w-12 h-12 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const Groups = () => {
  const { token, user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [users, setUsers] = useState([]);
const [selectedMembers, setSelectedMembers] = useState([]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setGroups(data);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

    const toggleMember = (id) => {
  setSelectedMembers((prev) =>
    prev.includes(id)
      ? prev.filter((m) => m !== id)
      : [...prev, id]
  );
};

  const createProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
       body: JSON.stringify({
  name: projectName,
  description: projectDescription,
  members: selectedMembers,
}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setProjectName("");
      setProjectDescription("");
      setSelectedMembers([]);
      setShowModal(false);
      fetchGroups();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

 useEffect(() => {
  fetchGroups();
  fetchUsers();
}, []);

    const fetchUsers = async () => {
  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      setUsers(data);
    }
  } catch (err) {
    console.error(err);
  }
};

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    return groups.filter((group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- Top Header Section --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Projects
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Manage your teams, monitor progress, and build together.
            </p>
          </div>
           
           {user?.role === "admin" && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/50 active:scale-95"
          >
            <PlusIcon />
            Create Project
          </button>
           )}
        </div>

        {/* --- Controls Bar: Search & Counter --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="text-xs font-medium text-slate-400 self-end sm:self-center">
            Showing <span className="text-indigo-400 font-bold">{filteredGroups.length}</span> of {groups.length} projects
          </div>
        </div>

        {/* --- Grid Layout --- */}
        {loading ? (
          /* Loading Skeleton State */
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 animate-pulse flex flex-col justify-between">
                <div>
                  <div className="h-6 bg-slate-800 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-slate-800/60 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-800/40 rounded w-2/3"></div>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-4">
                  <div className="h-4 bg-slate-800 rounded w-16"></div>
                  <div className="h-4 bg-slate-800 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <FolderPlusIcon />
            <h3 className="text-lg font-semibold text-slate-200">No projects found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              {searchQuery 
                ? "No projects matched your search query. Try typing something else."
                : "Get started by creating your first project workspace."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-5 inline-flex items-center rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-indigo-400 hover:bg-slate-700 transition-all"
              >
                Create One Now
              </button>
            )}
          </div>
        ) : (
          /* Project Cards */
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
  {filteredGroups.map((group) => (
    <div
      key={group._id}
      onClick={() => navigate(`/groups/${group._id}`)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:bg-slate-900 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer overflow-hidden"
    >
      {/* Subtle Ambient Hover Glow Background */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-indigo-500/20 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
            {group.name}
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Active
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-6 min-h-[40px] leading-relaxed">
          {group.description || "No project description provided."}
        </p>
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 relative z-10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="p-1.5 rounded-lg bg-slate-800/60 text-slate-300 group-hover:text-indigo-400 transition-colors">
            <UsersIcon className="w-3.5 h-3.5" />
          </span>
          <span>
            <strong className="text-slate-200 font-semibold">{group.members?.length || 0}</strong> Members
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="p-1.5 rounded-lg bg-slate-800/60 text-slate-300 group-hover:text-indigo-400 transition-colors">
            <CheckCircleIcon className="w-3.5 h-3.5" />
          </span>
          <span>
            <strong className="text-slate-200 font-semibold">0</strong> Tasks
          </span>
        </div>
      </div>
    </div>
  ))}
</div>
        )}

        {/* --- Create Project Modal --- */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div 
              className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Create New Project</h2>
                  <p className="text-xs text-slate-400 mt-1">Set up a workspace for your team.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={createProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. Website Redesign"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    placeholder="Briefly describe the goals or scope..."
                    rows={4}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </div>

                <div>
  <label className="block text-xs font-medium text-slate-300 mb-2">
    Assign Members
  </label>

  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 space-y-2">

    {users.map((member) => (

      <label
        key={member._id}
        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700 cursor-pointer"
      >

        <div>
          <p className="text-sm text-white">
            {member.name}
          </p>

          <p className="text-xs text-slate-400">
            {member.email}
          </p>
        </div>

        <input
          type="checkbox"
          checked={selectedMembers.includes(member._id)}
          onChange={() => toggleMember(member._id)}
          className="w-4 h-4 accent-indigo-600"
        />

      </label>

    ))}

  </div>
</div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !projectName.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Groups;