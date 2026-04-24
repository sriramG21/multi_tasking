import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";

const STATUSES = ["todo", "in_progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

const priorityConfig = {
  low: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  medium: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  high: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

const statusConfig = {
  todo: { bg: "bg-gray-100", text: "text-gray-600", label: "To Do" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "In Progress" },
  done: { bg: "bg-green-100", text: "text-green-700", label: "Done" },
};

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-8 h-8 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
      {initials}
    </div>
  );
}

function TaskModal({ task, members, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    assigned_to: task?.assigned_to || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (task) {
        await api.patch(`/tasks/${task.id}`, form);
      } else {
        await api.post("/tasks/", form);
      }
      onSave();
    } catch {
      alert("Error saving task");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h3 className="font-semibold mb-4 text-center">
          {task ? "Edit Task" : "New Task"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <textarea
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <div className="flex gap-2">
            <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg">
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, []);

  const fetchTasks = async () => {
    const res = await api.get("/tasks/");
    setTasks(res.data);
  };

  const fetchMembers = async () => {
    const res = await api.get("/organizations/members");
    setMembers(res.data);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditTask(null);
    fetchTasks();
  };

  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <div className="w-64 bg-white border-r p-5 flex flex-col justify-between">

        <div>
          <div className="text-center mb-6">
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-lg mx-auto mb-2">
              TF
            </div>
            <p className="font-semibold">TaskFlow</p>
          </div>

          <button className="w-full py-2 mb-2 bg-blue-100 rounded-lg">
            Tasks ({tasks.length})
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm">{user?.full_name}</p>
          <button
            onClick={logout}
            className="text-red-500 text-sm mt-2"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-8">

        <div className="flex justify-between items-center mb-6">
          <input
            placeholder="Search..."
            className="border px-3 py-2 rounded-lg w-60"
          />

          <button
            onClick={() => {
              setEditTask(null);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            New Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center mt-20">
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="bg-white p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-gray-400">{t.description}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditTask(t);
                      setShowModal(true);
                    }}
                    className="text-blue-600 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editTask}
          members={members}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}