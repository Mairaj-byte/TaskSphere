import React, { useEffect, useState } from "react";
import { useAuth, API_BASE } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Groups = () => {
  const { token } = useAuth();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // ==========================
  // Fetch Projects
  // ==========================

  const fetchGroups = async () => {
    try {
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

  // ==========================
  // Create Project
  // ==========================

  const createProject = async () => {
    try {
      const res = await fetch(`${API_BASE}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setProjectName("");
      setProjectDescription("");
      setShowModal(false);

      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="p-6">

      {/* Header */}

      <div className="mb-8 flex items-center justify-between">

        <h1 className="text-3xl font-bold text-white">
          Projects
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          + Create Project
        </button>

      </div>

      {/* Loading */}

      {loading ? (
        <div className="text-center text-white">
          Loading Projects...
        </div>
      ) : (

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {groups.length === 0 ? (

            <div className="rounded-xl border border-dashed border-gray-600 p-8 text-center text-gray-400">
              No Projects Yet
            </div>

          ) : (

            groups.map((group) => (

             <div
  key={group._id}
  onClick={() => navigate(`/groups/${group._id}`)}
  className="cursor-pointer rounded-2xl border border-gray-700 bg-slate-900 p-6 shadow transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20"
>

                <h2 className="mb-2 text-xl font-bold text-white">
                  {group.name}
                </h2>

                <p className="mb-5 text-gray-400">
                  {group.description || "No Description"}
                </p>

                <div className="flex justify-between">

                  <div>

                    <p className="text-xs text-gray-500">
                      Members
                    </p>

                    <p className="font-semibold text-white">
                      {group.members?.length || 0}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-gray-500">
                      Tasks
                    </p>

                    <p className="font-semibold text-white">
                      0
                    </p>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      )}

      {/* Modal */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

          <div className="w-full max-w-lg rounded-xl bg-slate-900 p-6">

            <h2 className="mb-6 text-2xl font-bold text-white">
              Create Project
            </h2>

            <input
              className="mb-4 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />

            <textarea
              className="mb-6 w-full rounded-lg border border-gray-600 bg-slate-800 p-3 text-white"
              placeholder="Project Description"
              rows={4}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-500 px-5 py-2 text-white"
              >
                Cancel
              </button>

              <button
                onClick={createProject}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700"
              >
                Create
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Groups;