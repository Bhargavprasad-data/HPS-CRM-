import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, Play, Check, X, ListTodo } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PRIORITY_STYLES = {
  Low:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Medium:   'bg-blue-500/10  text-blue-400  border-blue-500/20',
  High:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Critical: 'bg-red-500/10   text-red-400   border-red-500/20',
};

/* ── Modal ────────────────────────────────────────────────── */
function CreateModal({ onClose, onCreated, employees, customers }) {
  const [form, setForm] = useState({
    title: '', description: '', employee_id: '', priority: 'Medium', due_date: '', customer_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.employee_id) return toast.error('Title and Employee are required');
    setLoading(true);
    try {
      const payload = {
        name: form.title,
        description: form.description,
        customer_id: form.customer_id || null,
        end_date: form.due_date || null,
        priority: form.priority,
        status: 'Not Started',
        team_members: [{ employee_id: form.employee_id, role_in_project: 'Team Member' }]
      };
      await api.post('/projects', payload);
      toast.success('Project created and assigned successfully!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign project');
    } finally {
      setLoading(false);
    }
  };

  const staffEmployees = employees.filter(emp => emp.role_name === 'Staff');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/15 rounded-xl flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] font-bold">Assign Work Deliverable</h2>
              <p className="text-[var(--text-secondary)] text-xs">Fill in project details below</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div className="input-group">
            <label className="input-label">Project / Task Title *</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Test Production APIs" />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input h-20 resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief outline of deliverables…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Client / Customer</label>
              <select className="select" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Assign Staff *</label>
              <select className="select" required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">Select Employee</option>
                {staffEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation || 'Staff'})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Priority</label>
              <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {['Low','Medium','High','Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Due Date</label>
              <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks,     setTasks]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, custRes, projRes] = await Promise.all([
        api.get('/employees?limit=200'),
        api.get('/customers?limit=200'),
        api.get('/projects?limit=200')
      ]);
      setEmployees(empRes.data.data || []);
      setCustomers(custRes.data.data || []);
      setTasks(projRes.data.data || []);
    } catch {
      setEmployees([]);
      setCustomers([]);
      setTasks([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/projects?limit=200')
        .then(res => {
          setTasks(res.data.data || []);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (projectId, newStatus) => {
    try {
      const backendStatus = newStatus === 'Pending' ? 'Not Started' : newStatus;
      
      let progress = undefined;
      if (backendStatus === 'Completed') progress = 100;
      if (backendStatus === 'Not Started') progress = 0;

      await api.put(`/projects/${projectId}/progress`, {
        status: backendStatus,
        progress
      });
      toast.success(`Project moved to ${newStatus}`);
      fetchTasks();
    } catch {
      toast.error('Failed to update project status');
    }
  };

  const filtered = tasks.filter(t => {
    const titleMatch = (t.name || '').toLowerCase().includes(search.toLowerCase());
    const projectCodeMatch = (t.project_code || '').toLowerCase().includes(search.toLowerCase());
    const employeeMatch = (t.employee_names || '').toLowerCase().includes(search.toLowerCase());
    return titleMatch || projectCodeMatch || employeeMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Pipeline</h1>
          <p className="page-subtitle">Assign task deliverables and monitor staff workflows</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Assign New Task
        </button>
      </div>

      {/* Search */}
      <div className="card-glass flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input className="input pl-9" placeholder="Search tasks by title, project or staff…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Task List */}
      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Task / Project</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4].map(i => (
                  <tr key={i}>
                    <td><div className="skeleton h-4 w-32 mb-1" /><div className="skeleton h-3 w-20" /></td>
                    <td><div className="skeleton h-4 w-24" /></td>
                    <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                    <td><div className="skeleton h-4 w-20" /></td>
                    <td><div className="skeleton h-5 w-20 rounded-full" /></td>
                    <td><div className="skeleton h-8 w-20 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">
                    No tasks found matching your criteria.
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td>
                    <div className="font-semibold text-sm text-[var(--text-primary)]">{t.name}</div>
                    <div className="text-xs font-mono text-teal-400 mt-0.5">{t.project_code}</div>
                    {t.description && <div className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1 max-w-sm">{t.description}</div>}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-hover)] border border-[var(--border-card)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
                        {t.employee_names?.[0] || 'U'}
                      </div>
                      <span className="text-sm text-[var(--text-secondary)]">{t.employee_names || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium}`}>
                      {t.priority || 'Medium'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      {t.end_date ? new Date(t.end_date).toISOString().split('T')[0] : 'No Date'}
                    </div>
                  </td>
                  <td>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${
                      t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      t.status === 'Not Started' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                      'bg-teal-500/10 text-teal-400 border-teal-500/20'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {t.status === 'Not Started' && (
                        <button onClick={() => updateStatus(t.id, 'In Progress')} className="btn-secondary btn-sm gap-1">
                          <Play className="w-3.5 h-3.5" /> Start
                        </button>
                      )}
                      {(t.status === 'In Progress' || t.status === 'Testing' || t.status === 'On Hold') && (
                        <button onClick={() => updateStatus(t.id, 'Completed')} className="btn-success btn-sm gap-1">
                          <Check className="w-3.5 h-3.5" /> Complete
                        </button>
                      )}
                      {t.status === 'Completed' && (
                        <button onClick={() => updateStatus(t.id, 'In Progress')} className="btn-ghost btn-sm gap-1">
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={fetchTasks}
          employees={employees}
          customers={customers}
        />
      )}
    </div>
  );
}
