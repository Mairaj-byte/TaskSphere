import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, useAuth } from "../context/AuthContext";
import KanbanBoard from "../components/KanbanBoard";

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
        body: JSON.stringify({
          userId: selectedUser,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to add member.");
      }

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
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : "",
    });
    setShowEditModal(true);
  };

  if (!group) return <div className="p-6 text-white">Loading Project...</div>;

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

  return (
    <div className="p-6 space-y-8">
      {/* Group Header */}
      <div className="rounded-2xl border border-gray-700 bg-slate-900 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{group.name}</h1>
            <p className="mt-3 text-gray-400">
              {group.description || "No Description"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">Team Members</p>
            <h2 className="text-3xl font-bold text-indigo-400">
              {group.members?.length || 0}
            </h2>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Project Progress</span>
            <span className="font-semibold text-white">{progress}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-xl bg-slate-900 border border-gray-700 p-5">
          <p className="text-gray-400">Total Tasks</p>
          <h2 className="mt-3 text-3xl font-bold text-white">{tasks.length}</h2>
        </div>

        <div className="rounded-xl bg-slate-900 border border-gray-700 p-5">
          <p className="text-gray-400">Completed</p>
          <h2 className="mt-3 text-3xl font-bold text-green-400">
            {completedTasks}
          </h2>
        </div>

        <div className="rounded-xl bg-slate-900 border border-gray-700 p-5">
          <p className="text-gray-400">In Progress</p>
          <h2 className="mt-3 text-3xl font-bold text-yellow-400">
            {inProgressTasks}
          </h2>
        </div>

        <div className="rounded-xl bg-slate-900 border border-gray-700 p-5">
          <p className="text-gray-400">Overdue</p>
          <h2 className="mt-3 text-3xl font-bold text-red-400">{overdueTasks}</h2>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-2xl border border-gray-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Team Members</h2>
          <button
            onClick={() => setShowMemberModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            + Add Member
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          {group.members?.length ? (
            group.members.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3"
              >
                {member.profilePhoto ? (
                  <img
                    src={member.profilePhoto}
                    alt={member.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                    {member.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.role}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No members added yet.</p>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Available users: {users.length}
        </p>
      </div>

      {/* Project Tasks */}
<div className="rounded-2xl border border-gray-700 bg-slate-900 p-6">

  <div className="mb-5 flex items-center justify-between">

    <div className="flex gap-2">

      <button
        onClick={() => setView("list")}
        className={`rounded-lg px-4 py-2 ${
          view === "list"
            ? "bg-indigo-600 text-white"
            : "bg-slate-800 text-gray-300"
        }`}
      >
        List
      </button>

      <button
        onClick={() => setView("kanban")}
        className={`rounded-lg px-4 py-2 ${
          view === "kanban"
            ? "bg-indigo-600 text-white"
            : "bg-slate-800 text-gray-300"
        }`}
      >
        Kanban
      </button>

    </div>

    <button
      onClick={() => setShowTaskModal(true)}
      className="rounded-lg bg-green-600 px-4 py-2 text-white"
    >
      + New Task
    </button>

  </div>

  {view === "list" ? (

    tasks.length === 0 ? (

      <p className="text-gray-400">No Tasks Found</p>

    ) : (

      <div className="space-y-3">

        {tasks.map((task) => (

          <div
            key={task._id}
            className="rounded-xl border border-gray-700 p-4"
          >

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-semibold text-white">
                  {task.title}
                </h3>

                <span className="text-xs text-gray-400">
                  {task.status}
                </span>

              </div>

              <button
                onClick={() => openEditModal(task)}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
              >
                Edit
              </button>

            </div>

            <div className="mt-3">

              <p className="text-sm text-gray-400">
                {task.description || "No description"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs text-white">
                  {task.priority}
                </span>

                <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-white">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>

                {task.assignedTo?.length > 0 && (

                  <span className="rounded-full bg-green-700 px-3 py-1 text-xs text-white">
                    {task.assignedTo.map((user) => user.name).join(", ")}
                  </span>

                )}

              </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-xl bg-slate-900 p-6 border border-gray-700">
            <h2 className="mb-5 text-xl font-bold text-white">Add Team Member</h2>

            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            >
              <option value="">Select User</option>

              {users
                .filter(
                  (user) =>
                    !group.members?.some((member) => member._id === user._id)
                )
                .map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
            </select>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedUser("");
                }}
                className="rounded-lg border border-gray-600 px-4 py-2 text-white"
              >
                Cancel
              </button>

              <button
                onClick={addMember}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-slate-900 p-6">
            <h2 className="mb-5 text-xl font-bold text-white">Create Task</h2>

            <input
              type="text"
              placeholder="Task Title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            />

            <textarea
              rows="4"
              placeholder="Description"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            />

            <select
              value={taskForm.assignedTo}
              onChange={(e) =>
                setTaskForm({ ...taskForm, assignedTo: e.target.value })
              }
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            >
              <option value="">Assign Member</option>

              {group.members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>

            <select
              value={taskForm.priority}
              onChange={(e) =>
                setTaskForm({ ...taskForm, priority: e.target.value })
              }
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>

            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              className="mb-6 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-white"
              >
                Cancel
              </button>

              <button
                onClick={createTask}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-slate-900 p-6">
            <h2 className="mb-5 text-xl font-bold text-white">Edit Task</h2>

            <input
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />

            <textarea
              rows="4"
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />

            <select
              value={editForm.assignedTo}
              onChange={(e) =>
                setEditForm({ ...editForm, assignedTo: e.target.value })
              }
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            >
              {group.members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>

            <select
              value={editForm.priority}
              onChange={(e) =>
                setEditForm({ ...editForm, priority: e.target.value })
              }
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>

            <input
              type="date"
              value={editForm.dueDate}
              onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              className="mb-6 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded border border-gray-600 px-4 py-2 text-white"
              >
                Cancel
              </button>

              <button
                onClick={updateTask}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails;
