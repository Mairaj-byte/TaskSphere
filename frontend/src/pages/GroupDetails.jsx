import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, useAuth } from "../context/AuthContext";
import KanbanBoard from "../components/KanbanBoard";
import {
  Users,
  Plus,
  Calendar,
  List,
  Kanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Edit3,
  Briefcase,
  UserPlus,
  Loader2,
  Sparkles,
} from "lucide-react";

const GroupDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [view, setView] = useState("list");

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "Medium",
    dueDate: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "Medium",
    dueDate: "",
  });

  useEffect(() => {
    fetchGroup();
    fetchTasks();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setGroup(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const addMember = async () => {
    if (!selectedUser) {
      alert("Please select a user.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/groups/${id}/member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to add member.");

      setGroup(data);
      setSelectedUser("");
      setShowMemberModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const createTask = async () => {
    if (!taskForm.title || !taskForm.assignedTo || !taskForm.dueDate) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate,
          assignedTo: [taskForm.assignedTo],
          group: id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to create task");

      await fetchTasks();
      setTaskForm({
        title: "",
        description: "",
        assignedTo: "",
        priority: "Medium",
        dueDate: "",
      });
      setShowTaskModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const updateTask = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${editingTask._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          dueDate: editForm.dueDate,
          assignedTo: [editForm.assignedTo],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchTasks();
      setShowEditModal(false);
      setEditingTask(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo?.[0]?._id || task.assignedTo?.[0] || "",
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
    });
    setShowEditModal(true);
  };

  if (!group)
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-slate-400">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading project workspace...</p>
      </div>
    );

  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const pendingTasks = tasks.filter((task) => task.status === "Pending").length;
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length;
  const overdueTasks = tasks.filter(
    (task) =>
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "Completed"
  ).length;

  const progress =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "High":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Medium":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-8 text-slate-100 min-h-screen bg-slate-950 selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Glow Accent */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Group Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -ml-20 -mb-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 shadow-sm backdrop-blur-md">
              <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
              <span>Workspace Project</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              {group.name}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base font-normal">
              {group.description || "No description provided for this project."}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-xl shadow-inner hover:border-white/20 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 ring-1 ring-indigo-500/30 shadow-md">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Team Members
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {group.members?.length || 0}
              </h2>
            </div>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-300 flex items-center gap-2">
              Overall Progress
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            </span>
            <span className="text-emerald-400 font-bold tracking-wide">{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-950/80 p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-1000 ease-out shadow-lg shadow-emerald-500/20"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Tasks", count: tasks.length, icon: List, color: "indigo" },
          { label: "Completed", count: completedTasks, icon: CheckCircle2, color: "emerald" },
          { label: "In Progress", count: inProgressTasks, icon: Clock, color: "amber" },
          { label: "Overdue", count: overdueTasks, icon: AlertTriangle, color: "rose" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          const colorStyles = {
            indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
            emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
          }[stat.color];

          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl hover:shadow-black/40"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2 rounded-xl border ${colorStyles}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">{stat.count}</p>
            </div>
          );
        })}
      </div>

      {/* Team Members Section */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Team Members</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {users.length} available user{users.length === 1 ? "" : "s"} across workspace
            </p>
          </div>
          <button
            onClick={() => setShowMemberModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:bg-indigo-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <UserPlus className="h-4 w-4" /> Add Member
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {group.members?.length ? (
            group.members.map((member) => (
              <div
                key={member._id}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3.5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-950/80 hover:shadow-lg"
              >
                {member.profilePhoto ? (
                  <img
                    src={member.profilePhoto}
                    alt={member.name}
                    className="h-11 w-11 rounded-xl object-cover ring-2 ring-indigo-500/30 shadow-md group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md ring-2 ring-indigo-500/30 group-hover:scale-105 transition-transform">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {member.name}
                  </p>
                  <p className="truncate text-xs font-medium text-slate-400">{member.role || "Member"}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center border border-dashed border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-400 font-medium">No members assigned to this group yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 rounded-2xl bg-slate-950/80 p-1.5 border border-slate-800 w-fit shadow-inner">
            <button
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                view === "list"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <List className="h-3.5 w-3.5" /> List View
            </button>

            <button
              onClick={() => setView("kanban")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                view === "kanban"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" /> Kanban Board
            </button>
          </div>

          <button
            onClick={() => setShowTaskModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:bg-emerald-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-fit"
          >
            <Plus className="h-4 w-4" /> New Task
          </button>
        </div>

        {view === "list" ? (
          tasks.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
              <p className="text-sm font-medium text-slate-400">No tasks created yet for this project.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="group relative rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-950/80 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-white text-base group-hover:text-indigo-300 transition-colors">
                          {task.title}
                        </h3>
                        <span className="rounded-full bg-slate-800/80 px-3 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700/60">
                          {task.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed max-w-3xl font-normal">
                        {task.description || "No description provided."}
                      </p>
                    </div>

                    <button
                      onClick={() => openEditModal(task)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-600/10 hover:text-indigo-300 transition-all shadow-sm"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-3.5 border-t border-slate-800/60">
                    <span
                      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority} Priority
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                    </span>

                    {task.assignedTo?.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300">
                        <Users className="h-3.5 w-3.5 text-indigo-400" />
                        {task.assignedTo.map((user) => user.name || "User").join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <KanbanBoard tasks={tasks} />
        )}
      </div>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Add Team Member</h2>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedUser("");
                }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Select User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="">Choose team member...</option>
                {users
                  .filter(
                    (user) =>
                      !group.members?.some((member) => member._id === user._id)
                  )
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role || "Member"})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedUser("");
                }}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={addMember}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Create New Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Design System Updates"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Add context or details..."
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assign Member
                  </label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, assignedTo: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">Select Assignee</option>
                    {group.members?.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowTaskModal(false)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={createTask}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Edit Task</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="3"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={editForm.assignedTo}
                    onChange={(e) =>
                      setEditForm({ ...editForm, assignedTo: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    {group.members?.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={updateTask}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  


export default GroupDetails;