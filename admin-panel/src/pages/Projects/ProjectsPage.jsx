import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FolderKanban, Calendar, Users, TrendingUp, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColors = {
  'Not Started': 'badge-gray',
  'In Progress': 'badge-blue',
  'Testing': 'badge-yellow',
  'Completed': 'badge-green',
  'On Hold': 'badge-purple',
  'Cancelled': 'badge-red',
};

const priorityColors = {
  Low: 'text-slate-400',
  Medium: 'text-blue-400',
  High: 'text-amber-400',
  Critical: 'text-red-400',
};

const ProjectModal = ({ project, onClose, onSaved }) => {
  const [form, setForm] = useState(
    project
      ? {
          name: project.name || '',
          description: project.description || '',
          customer_id: project.customer_id || '',
          manager_id: project.manager_id || '',
          start_date: project.start_date ? project.start_date.substring(0, 10) : '',
          end_date: project.end_date ? project.end_date.substring(0, 10) : '',
          budget: project.budget || '',
          status: project.status || 'Not Started',
          priority: project.priority || 'Medium',
          progress: project.progress || 0,
          employee_id: (project.employee_ids ? project.employee_ids.split(',')[0].trim() : ''),
        }
      : {
          name: '',
          description: '',
          customer_id: '',
          manager_id: '',
          start_date: '',
          end_date: '',
          budget: '',
          status: 'Not Started',
          priority: 'Medium',
          progress: 0,
          employee_id: '',
        }
  );
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [empRes, custRes] = await Promise.all([
          api.get('/employees?limit=200'),
          api.get('/customers?limit=200'),
        ]);
        setEmployees(empRes.data.data || []);
        setCustomers(custRes.data.data || []);
      } catch (err) {
        toast.error('Failed to load options.');
      }
    };
    fetchSelectData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        customer_id: form.customer_id || null,
        manager_id: form.manager_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : 0,
        status: form.status,
        priority: form.priority,
        progress: form.progress ? parseInt(form.progress) : 0,
        team_members: form.employee_id ? [{ employee_id: form.employee_id, role_in_project: 'Team Member' }] : []
      };
      if (project) {
        await api.put(`/projects/${project.id}`, payload);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', payload);
        toast.success('Project created successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const projectManagers = employees.filter(
    (emp) =>
      emp.role_name === 'Manager' ||
      emp.role_name === 'Admin' ||
      emp.id === form.manager_id
  );

  const staffEmployees = employees.filter(
    (emp) =>
      emp.role_name === 'Staff' ||
      emp.id === form.employee_id
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}>
              <FolderKanban size={15} strokeWidth={2} className="text-white" />
            </div>
            <h2 className="text-lg font-bold" style={{color:'var(--text-primary)'}}>{project ? 'Edit Project' : 'New Project'}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon"><X size={16} strokeWidth={2} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="input-group col-span-2">
            <label className="input-label">Project Name *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Website Redesign"
            />
          </div>

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Customer / Client *</label>
            <select
              className="select w-full"
              required
              value={form.customer_id || ''}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            >
              <option value="">Select Customer</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>{cust.name} {cust.company ? `(${cust.company})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Project Manager</label>
            <select
              className="select w-full"
              value={form.manager_id || ''}
              onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
            >
              <option value="">Select Manager</option>
              {projectManagers.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
              ))}
            </select>
          </div>

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Assign Staff Employee</label>
            <select
              className="select w-full"
              value={form.employee_id || ''}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            >
              <option value="">Select Staff Employee</option>
              {staffEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation || 'Staff'})</option>
              ))}
            </select>
          </div>

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Start Date</label>
            <input
              type="date"
              className="input"
              value={form.start_date || ''}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">End Date</label>
            <input
              type="date"
              className="input"
              value={form.end_date || ''}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Budget (INR)</label>
            <input
              type="number"
              className="input"
              value={form.budget || ''}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="e.g. 150000"
            />
          </div>

          {project && (
            <div className="input-group col-span-2 sm:col-span-1">
              <label className="input-label">Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
              />
            </div>
          )}

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Priority</label>
            <select
              className="select w-full"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Status</label>
            <select
              className="select w-full"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Testing">Testing</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="input-group col-span-2">
            <label className="input-label">Project Description</label>
            <textarea
              className="input resize-none h-20"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Project goals, scopes..."
            />
          </div>

          <div className="col-span-2 flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border-card)'}}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Shimmer Skeleton ──
function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-52" />
          <div className="skeleton skeleton-text w-64" />
        </div>
        <div className="skeleton skeleton-button w-36" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card text-center py-3">
            <div className="skeleton h-8 w-10 mx-auto" />
            <div className="skeleton h-3 w-16 mx-auto mt-2" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-glass flex gap-3">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="skeleton h-10 w-44 rounded-xl" />
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card space-y-3" style={{ padding: '14px', minHeight: '180px' }}>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="flex gap-2">
                  <div className="skeleton h-3 w-12" />
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-6 w-12 rounded-md" />
            </div>
            <div className="space-y-1 pt-1">
              <div className="skeleton h-2 w-8" />
              <div className="skeleton h-1.5 w-full" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-full" />
            </div>
            <div className="pt-2 border-t border-slate-800/10 flex justify-between">
              <div className="skeleton h-3.5 w-8" />
              <div className="skeleton h-3.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchProjects = useCallback(async (isRetry = false) => {
    if (!isRetry && projects.length === 0) setLoading(true);
    try {
      const [projRes, statRes] = await Promise.all([
        api.get(`/projects?search=${search}&status=${statusFilter}&limit=50`),
        api.get('/projects/stats'),
      ]);
      setProjects(projRes.data.data || []);
      setStats(statRes.data.data || {});
      setLoading(false);
      setIsOffline(false);
    } catch (e) {
      setIsOffline(true);
      if (projects.length === 0) {
        setLoading(true);
      } else {
        setLoading(false);
      }
      setTimeout(() => {
        fetchProjects(true);
      }, 3000);
    }
  }, [search, statusFilter, projects.length]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        api.get(`/projects?search=${search}&status=${statusFilter}&limit=50`),
        api.get('/projects/stats'),
      ])
        .then(([projRes, statRes]) => {
          setProjects(projRes.data.data || []);
          setStats(statRes.data.data || {});
          setIsOffline(false);
          setLoading(false);
        })
        .catch(() => {
          setIsOffline(true);
          if (projects.length === 0) {
            setLoading(true);
          }
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [search, statusFilter, projects.length]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the project "${name}"?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  if (loading && projects.length === 0) return <ProjectsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Management</h1>
          <p className="page-subtitle">Track all projects and team assignments</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowModal(true); }} className="btn-primary" disabled={isOffline}>
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* ── Reconnecting Banner ── */}
      {isOffline && (
        <div className="w-full flex items-center justify-between px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Connection lost. Showing offline cached data. Reconnecting in background...</span>
          </div>
          <span className="text-[10px] opacity-75">Retrying...</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',       value: stats.total       || 0, color: '#eeeef5', bg: 'rgba(255,255,255,0.04)',   border: 'rgba(255,255,255,0.08)' },
          { label: 'In Progress', value: stats.in_progress || 0, color: '#818cf8', bg: 'rgba(99,102,241,0.08)',   border: 'rgba(99,102,241,0.18)' },
          { label: 'Completed',   value: stats.completed   || 0, color: '#34d399', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.18)' },
          { label: 'Not Started', value: stats.not_started || 0, color: '#94a3b8', bg: 'rgba(148,163,184,0.06)',  border: 'rgba(148,163,184,0.12)' },
          { label: 'Overdue',     value: stats.overdue     || 0, color: '#f87171', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.18)' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            transition={{delay:i*0.06,duration:0.3,ease:[0.16,1,0.3,1]}}
            className="card text-center py-3"
            style={{border:`1px solid ${s.border}`,background:s.bg}}
          >
            <p className="text-2xl font-extrabold" style={{color:s.color}}>{s.value}</p>
            <p className="text-[11px] font-semibold mt-1" style={{color:'var(--text-muted)'}}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-glass flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['Not Started', 'In Progress', 'Testing', 'Completed', 'On Hold', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {projects.map((p) => (
          <div key={p.id} className={`card hover:border-slate-700 transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${isOffline ? 'opacity-70 pointer-events-none' : ''}`} style={{ padding: '14px', minHeight: '180px' }}>
            {isOffline && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--shimmer-highlight)] to-transparent animate-[shimmer_1.7s_infinite_linear] pointer-events-none" style={{ backgroundSize: '200% 100%' }} />
            )}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-blue-500 text-[10px] font-mono">{p.project_code}</span>
                  <span className={statusColors[p.status] || 'badge-gray'} style={{ fontSize: '8.5px', padding: '1px 5px', borderRadius: '5px' }}>{p.status}</span>

                  <span className={`text-[10px] font-semibold ${priorityColors[p.priority]}`}>{p.priority}</span>
                </div>
                <h3 className="font-bold text-xs leading-tight truncate" style={{color:'var(--text-primary)'}}>{p.name}</h3>
                <p className="text-[10.5px] mt-0.5" style={{color:'var(--text-muted)'}}>{p.customer_name}</p>
              </div>
              <div className="flex gap-0.5 ml-2">
                <button onClick={() => { setEditProject(p); setShowModal(true); }} className="btn-ghost p-1 text-blue-400">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(p.id, p.name)} className="btn-ghost p-1 text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span style={{color:'var(--text-muted)'}}>Progress</span>
                <span style={{color:'var(--text-primary)'}} className="font-semibold">{p.progress || 0}%</span>
              </div>
              <div className="w-full bg-slate-800/40 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    p.progress >= 100 ? 'bg-emerald-500' :
                    p.progress >= 60 ? 'bg-blue-500' :
                    p.progress >= 30 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <TrendingUp className="w-3 h-3 text-slate-500" />
                <span>{p.end_date ? new Date(p.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Users className="w-3 h-3 text-slate-500" />
                <span>{p.team_size || 0} mem</span>
              </div>
            </div>

            {p.budget && (
              <div className="mt-2 pt-2 border-t border-slate-800/20 flex items-center justify-between">
                <span className="text-[10px]" style={{color:'var(--text-muted)'}}>Budget</span>
                <span className="text-emerald-400 text-xs font-semibold">₹{parseFloat(p.budget).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSaved={fetchProjects}
        />
      )}
    </div>
  );
}
