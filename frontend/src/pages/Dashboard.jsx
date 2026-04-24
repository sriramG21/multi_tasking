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

function Avatar({ name, size = "sm" }) {
  const initials = (name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-purple-200 text-purple-800", "bg-blue-200 text-blue-800", "bg-green-200 text-green-800", "bg-amber-200 text-amber-800", "bg-pink-200 text-pink-800"];
  const color = colors[(name || "").charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-medium flex-shrink-0`}>
      {initials}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const config = type === "error"
    ? "bg-red-50 border-red-200 text-red-700"
    : "bg-green-50 border-green-200 text-green-700";
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${config} animate-slide-up`}>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100">✕</button>
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
    due_date: task?.due_date ? task.due_date.slice(0, 10) : ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null };
      if (task) {
        await api.patch(`/tasks/${task.id}`, payload);
      } else {
        await api.post("/tasks/", payload);
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.detail || "Error saving task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{task ? "Edit task" : "New task"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Task title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              placeholder="Add details..."
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.assigned_to}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
              >
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
              {task ? "Save changes" : "Create task"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchTasks(); fetchMembers(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks/");
      setTasks(res.data);
    } finally { setLoading(false); }
  };

  const fetchMembers = async () => {
    const res = await api.get("/organizations/members");
    setMembers(res.data);
  };

  const fetchAuditLogs = async () => {
    const res = await api.get("/organizations/audit-logs");
    setAuditLogs(res.data);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "audit") fetchAuditLogs();
  };

  const handleSave = () => {
    setShowModal(false);
    setEditTask(null);
    fetchTasks();
    setToast({ message: editTask ? "Task updated!" : "Task created!", type: "success" });
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
      setToast({ message: "Task deleted", type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.detail || "Cannot delete", type: "error" });
    }
  };

  const canModify = (task) => user?.role === "admin" || task.created_by === user?.id;

  const getMember = (id) => members.find(m => m.id === id);

  const isOverdue = (date) => date && new Date(date) < new Date();

  const filteredTasks = tasks.filter(t => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const taskCounts = {
    todo: tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar + Main layout */}
      <div className="flex h-screen overflow-hidden">

        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">TaskFlow</p>
                <p className="text-xs text-gray-400">{user?.role === "admin" ? "Admin" : "Member"}</p>
              </div>
            </div>
          </div>

          <nav className="p-3 flex-1">
            {[
              { id: "tasks", label: "Tasks", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              { id: "members", label: "Members", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
              ...(user?.role === "admin" ? [{ id: "audit", label: "Audit Logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition mb-1 ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
                {tab.id === "tasks" && (
                  <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tasks.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar name={user?.full_name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button onClick={logout} className="text-gray-400 hover:text-red-500 transition" title="Logout">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">

          {/* TASKS TAB */}
          {activeTab === "tasks" && (
            <div className="p-8">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "To Do", count: taskCounts.todo, color: "text-gray-700", bg: "bg-gray-100" },
                  { label: "In Progress", count: taskCounts.in_progress, color: "text-blue-700", bg: "bg-blue-100" },
                  { label: "Done", count: taskCounts.done, color: "text-green-700", bg: "bg-green-100" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${stat.bg} ${stat.color}`}>
                      {Math.round(tasks.length ? stat.count / tasks.length * 100 : 0)}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {[["all", "All"], ["todo", "Todo"], ["in_progress", "In Progress"], ["done", "Done"]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setFilter(val)}
                      className={`px-3 py-2.5 text-sm transition ${filter === val ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setEditTask(null); setShowModal(true); }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Task
                </button>
              </div>

              {/* Task list */}
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-20"></div>)}
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No tasks found</p>
                  <p className="text-gray-400 text-sm mt-1">Create your first task to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map(task => {
                    const assignee = getMember(task.assigned_to);
                    const overdue = isOverdue(task.due_date) && task.status !== "done";
                    const pc = priorityConfig[task.priority];
                    const sc = statusConfig[task.status];
                    return (
                      <div key={task.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 hover:border-gray-200 transition group">
                        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${pc.dot}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className={`font-medium text-gray-900 ${task.status === "done" ? "line-through text-gray-400" : ""}`}>
                              {task.title}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                              {sc.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pc.bg} ${pc.text}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-500 mb-2 truncate">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            {task.due_date && (
                              <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {overdue ? "Overdue · " : ""}{new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {assignee && (
                              <span className="flex items-center gap-1">
                                <Avatar name={assignee.full_name} size="xs" />
                                {assignee.full_name || assignee.email}
                              </span>
                            )}
                          </div>
                        </div>
                        {canModify(task) && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => { setEditTask(task); setShowModal(true); }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === "members" && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Team members</h2>
              <div className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <Avatar name={m.full_name} size="lg" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{m.full_name || "—"}</p>
                      <p className="text-sm text-gray-400">{m.email}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      m.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {m.role}
                    </span>
                    {m.id === user?.id && (
                      <span className="text-xs text-blue-500 font-medium">You</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === "audit" && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Audit logs</h2>
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-gray-400 text-center py-12">No audit logs yet</p>
                ) : auditLogs.map(log => (
                  <div key={log.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg">{log.action}</span>
                        <span className="text-xs text-gray-400">by {getMember(log.user_id)?.email || "unknown"}</span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <pre className="text-xs text-gray-400 bg-gray-50 p-2 rounded-lg overflow-auto mt-1">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TaskModal
          task={editTask}
          members={members}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}