import { useState, useEffect, useCallback } from 'react';
import { Search, Building2, Calendar, Users, TrendingUp, FolderOpen, X, Play, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLUMNS = [
  { id: 'Pending',     label: 'Pending',     accent: 'border-t-slate-500',   badge: 'badge-gray'  },
  { id: 'In Progress', label: 'In Progress', accent: 'border-t-teal-500',    badge: 'badge-teal'  },
  { id: 'Completed',   label: 'Completed',   accent: 'border-t-emerald-500', badge: 'badge-green' },
];

const PRIORITY_STYLES = {
  Low:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Medium:   'bg-blue-500/10  text-blue-400  border-blue-500/20',
  High:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Critical: 'bg-red-500/10   text-red-400   border-red-500/20',
};

/* ── Skeleton ─────────────────────────────────────────────── */
function ProjectCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton-text w-24" />
        <div className="skeleton w-14 h-4 rounded-full" />
      </div>
      <div className="skeleton-text w-3/4" />
      <div className="skeleton-text w-full" />
      <div className="skeleton-text w-2/3" />
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-card)]">
        <div className="skeleton w-5 h-5 rounded-full" />
        <div className="skeleton-text w-20" />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: 'Not Started', progress: 0 });
  const [updating, setUpdating] = useState(false);

  const handleOpenUpdateModal = (p) => {
    setSelectedProject(p);
    setUpdateForm({
      status: p.status || 'Not Started',
      progress: p.progress || 0
    });
    setShowModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setUpdating(true);
    try {
      await api.put(`/projects/${selectedProject.id}/progress`, updateForm);
      toast.success('Project progress updated! 🚀');
      setShowModal(false);
      fetchProjects(true); // silent refresh
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (projectId, newStatus) => {
    try {
      setUpdating(true);
      const backendStatus = newStatus === 'Pending' ? 'Not Started' : newStatus;
      
      let progress = undefined;
      if (backendStatus === 'Completed') progress = 100;
      if (backendStatus === 'Not Started') progress = 0;

      await api.put(`/projects/${projectId}/progress`, {
        status: backendStatus,
        progress
      });
      toast.success(`Project moved to ${newStatus}`);
      fetchProjects(true);
    } catch {
      toast.error('Failed to update project status');
    } finally {
      setUpdating(false);
    }
  };

  const fetchProjects = useCallback(async (isRetry = false) => {
    if (!isRetry) setLoading(true);
    try {
      const res = await api.get(`/projects?search=${search}&limit=50`);
      setProjects(res.data.data || []);
      setLoading(false);
    } catch {
      setLoading(true);
      setTimeout(() => {
        fetchProjects(true);
      }, 3000);
    }
  }, [search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        api.get(`/projects?search=${search}&limit=50`)
          .then((res) => {
            setProjects(res.data.data || []);
          })
          .catch(() => {
            setLoading(true);
            fetchProjects();
          });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, fetchProjects, search]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Projects</h1>
          <p className="page-subtitle">Track milestones and progress on your active projects</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl text-xs text-[var(--text-secondary)]">
            <Building2 className="w-3.5 h-3.5 text-violet-400" />
            {projects.length} project{projects.length !== 1 ? 's' : ''} assigned
          </div>
        )}
      </div>

      {/* Search */}
      <div className="card-glass py-3 px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            className="input pl-9"
            placeholder="Search projects by name, code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {STATUS_COLUMNS.map((col) => {
          const colTasks = projects.filter(t => {
            if (col.id === 'Pending') return t.status === 'Not Started';
            if (col.id === 'In Progress') return t.status === 'In Progress' || t.status === 'Testing' || t.status === 'On Hold';
            if (col.id === 'Completed') return t.status === 'Completed';
            return false;
          });

          return (
            <div key={col.id} className={`card p-4 border-t-4 flex flex-col h-[calc(100vh-300px)] min-h-[420px] ${col.accent}`}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-card)]">
                <span className="text-[var(--text-primary)] font-bold text-sm">{col.label}</span>
                <span className={`${col.badge} text-xs font-mono`}>{colTasks.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {loading
                  ? [1,2].map(i => <ProjectCardSkeleton key={i} />)
                  : colTasks.length === 0
                    ? (
                      <div className="py-12 text-center text-xs text-[var(--text-secondary)] border border-dashed border-[var(--border-card)] rounded-xl">
                        No projects in {col.label}
                      </div>
                    )
                    : colTasks.map((p) => (
                      <div key={p.id} className="p-4 bg-[var(--bg-input)] border border-[var(--border-card)] rounded-xl space-y-3 hover:border-teal-500/20 hover:bg-[var(--bg-hover)] transition-all duration-150 cursor-pointer" onClick={() => handleOpenUpdateModal(p)}>
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-teal-400 font-mono text-[10px] uppercase font-bold tracking-wider truncate">{p.project_code}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${PRIORITY_STYLES[p.priority] || PRIORITY_STYLES.Medium}`}>{p.priority}</span>
                          </div>
                          <h4 className="text-[var(--text-primary)] font-semibold text-sm leading-snug">{p.name}</h4>
                          {p.description && <p className="text-[var(--text-secondary)] text-xs mt-1 line-clamp-2 leading-relaxed">{p.description}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-card)] text-xs text-[var(--text-secondary)]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)] uppercase border border-[var(--border-card)]">
                              {p.manager_name?.[0] || 'M'}
                            </div>
                            <span className="truncate max-w-[80px]" title={p.manager_name || 'Manager'}>{p.manager_name || 'Manager'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono">
                            <Calendar className="w-3 h-3 opacity-60" />
                            <span>{p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : 'No Date'}</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {col.id === 'Pending' && (
                            <button onClick={() => updateStatus(p.id, 'In Progress')} className="btn-secondary btn-sm w-full gap-1 justify-center" disabled={updating}>
                              <Play className="w-3.5 h-3.5" /> Start
                            </button>
                          )}
                          {col.id === 'In Progress' && (
                            <button onClick={() => updateStatus(p.id, 'Completed')} className="btn-success btn-sm w-full gap-1 justify-center" disabled={updating}>
                              <Check className="w-3.5 h-3.5" /> Complete
                            </button>
                          )}
                          {col.id === 'Completed' && (
                            <button onClick={() => updateStatus(p.id, 'In Progress')} className="btn-ghost btn-sm w-full gap-1 justify-center" disabled={updating}>
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Update Progress Modal */}
      {showModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">Update Progress</h2>
                  <p className="text-[10px] text-[var(--text-secondary)]">{selectedProject.project_code} · {selectedProject.name}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-2 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-5">
              <div className="input-group">
                <label className="input-label">Project Status</label>
                <select
                  className="select w-full"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                >
                  {['Not Started', 'In Progress', 'Testing', 'Completed', 'On Hold', 'Cancelled'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="input-label mb-0">Progress Percentage</label>
                  <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">{updateForm.progress}%</span>
                </div>
                <input
                  type="range"
                  className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-violet-500"
                  min="0"
                  max="100"
                  value={updateForm.progress}
                  onChange={(e) => setUpdateForm({ ...updateForm, progress: parseInt(e.target.value) })}
                />
                <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-card)]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={updating} className="btn-primary">
                  {updating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
