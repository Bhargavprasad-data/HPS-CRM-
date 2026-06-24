import { useState, useEffect, useCallback } from 'react';
import { Search, FolderKanban, Calendar, Users, TrendingUp, ArrowUpRight, X, UserPlus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  'Not Started': 'badge-gray',
  'In Progress': 'badge-blue',
  'Testing':     'badge-purple',
  'Completed':   'badge-green',
  'On Hold':     'badge-yellow',
  'Cancelled':   'badge-red',
};

const PRIORITY_COLORS = {
  Low:      { cls: 'text-slate-400',  dot: 'bg-slate-400'  },
  Medium:   { cls: 'text-blue-400',   dot: 'bg-blue-400'   },
  High:     { cls: 'text-amber-400',  dot: 'bg-amber-400'  },
  Critical: { cls: 'text-red-400',    dot: 'bg-red-400'    },
};

/* ── Skeleton ─────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="card space-y-3" style={{ padding: '14px', minHeight: '180px' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="skeleton w-12 h-3.5 rounded" />
        <div className="skeleton w-16 h-4 rounded-md" />
        <div className="skeleton w-10 h-3.5 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="skeleton h-3.5 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
      <div className="skeleton h-1.5 rounded-full w-full mt-2" />
      <div className="flex gap-2 pt-2 border-t border-[var(--border-card)]">
        <div className="skeleton h-3 w-12 flex-1" />
        <div className="skeleton h-3 w-12 flex-1" />
        <div className="skeleton h-3 w-12 flex-1" />
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="card text-center py-4">
      <div className="skeleton w-10 h-7 rounded-lg mx-auto mb-2" />
      <div className="skeleton-text w-16 mx-auto" />
    </div>
  );
}

/* ── Team Assignment Modal ─────────────────────────────────── */
const TeamAssignmentModal = ({ project, onClose, onSaved }) => {
  const [employees, setEmployees] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [roleInProject, setRoleInProject] = useState('Team Member');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, projDetailsRes] = await Promise.all([
        api.get('/employees?limit=200'),
        api.get(`/projects/${project.id}`),
      ]);
      setEmployees(empRes.data.data || []);
      setTeam(projDetailsRes.data.data?.team || []);
    } catch (err) {
      toast.error('Failed to load team details.');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    setActionLoading(true);
    try {
      await api.post(`/projects/${project.id}/assign`, {
        employee_id: selectedEmployeeId,
        role_in_project: roleInProject,
      });
      toast.success('Team member assigned successfully.');
      setSelectedEmployeeId('');
      setRoleInProject('Team Member');
      fetchData();
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (employeeId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/projects/${project.id}/assign/${employeeId}`);
      toast.success('Team member removed successfully.');
      fetchData();
      onSaved();
    } catch (err) {
      toast.error('Failed to remove member.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/15 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-lg">Manage Team</h2>
              <p className="text-[var(--text-secondary)] text-xs truncate max-w-[280px]">{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Assignment Form */}
          <form onSubmit={handleAssign} className="space-y-4 bg-[var(--bg-card-glass)] p-4 border border-[var(--border-card)] rounded-2xl">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Assign New Member</h3>
            <div className="space-y-3">
              <div className="input-group">
                <label className="input-label">Select Employee</label>
                <select
                  required
                  className="select w-full"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <option value="">Choose Employee</option>
                  {employees
                    .filter(emp => emp.role_name === 'Staff' && !team.some(t => t.employee_id === emp.id))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation || emp.role_name})</option>
                    ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Role in Project</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={roleInProject}
                  onChange={(e) => setRoleInProject(e.target.value)}
                  placeholder="e.g. Lead Developer, QA Tester"
                />
              </div>

              <button type="submit" disabled={actionLoading || !selectedEmployeeId} className="btn-primary w-full text-center py-2 flex items-center justify-center gap-2">
                Assign Member
              </button>
            </div>
          </form>

          {/* Current Team List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Current Members ({team.length})</h3>
            {loading ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="skeleton h-12 w-full rounded-xl" />)}
              </div>
            ) : team.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-4">No team members assigned to this project yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {team.map((member) => (
                  <div key={member.employee_id} className="flex items-center justify-between p-3 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{member.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">{member.role_in_project} • {member.designation}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(member.employee_id)}
                      disabled={actionLoading}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs shrink-0 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


/* ── Progress bar ─────────────────────────────────────────── */
function ProgressBar({ value }) {
  const color =
    value >= 100 ? 'from-emerald-500 to-emerald-400' :
    value >= 60  ? 'from-teal-500 to-teal-400' :
    value >= 30  ? 'from-amber-500 to-amber-400' :
                   'from-red-500 to-red-400';
  return (
    <div className="w-full bg-[var(--border-card)] rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${value || 0}%` }}
      />
    </div>
  );
}

export default function ProjectsPage() {
  const [projects,     setProjects]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState({});
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);

  const fetchProjects = useCallback(async (isRetry = false) => {
    if (!isRetry) setLoading(true);
    try {
      const [projRes, statRes] = await Promise.all([
        api.get(`/projects?search=${search}&status=${statusFilter}&limit=50`),
        api.get('/projects/stats'),
      ]);
      setProjects(projRes.data.data || []);
      setStats(statRes.data.data || {});
      setLoading(false);
    } catch {
      setLoading(true);
      setTimeout(() => {
        fetchProjects(true);
      }, 3000);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        Promise.all([
          api.get(`/projects?search=${search}&status=${statusFilter}&limit=50`),
          api.get('/projects/stats'),
        ])
          .then(([projRes, statRes]) => {
            setProjects(projRes.data.data || []);
            setStats(statRes.data.data || {});
          })
          .catch(() => {
            setLoading(true);
            fetchProjects();
          });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, fetchProjects, search, statusFilter]);

  const STAT_CARDS = [
    { label: 'Total',       value: stats.total       || 0, color: 'text-[var(--text-primary)]' },
    { label: 'In Progress', value: stats.in_progress || 0, color: 'text-blue-400'              },
    { label: 'Completed',   value: stats.completed   || 0, color: 'text-emerald-400'           },
    { label: 'Not Started', value: stats.not_started || 0, color: 'text-[var(--text-secondary)]'},
    { label: 'Overdue',     value: stats.overdue     || 0, color: 'text-red-400'               },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Management</h1>
          <p className="page-subtitle">Track all team projects and progressions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {loading
          ? [1,2,3,4,5].map(i => <StatSkeleton key={i} />)
          : STAT_CARDS.map((s) => (
            <div key={s.label} className="card text-center py-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[var(--text-secondary)] text-xs mt-1">{s.label}</p>
            </div>
          ))
        }
      </div>

      {/* Filters */}
      <div className="card-glass flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            className="input pl-9"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {['Not Started','In Progress','Testing','Completed','On Hold'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {loading
          ? [1,2,3,4].map(i => <CardSkeleton key={i} />)
          : projects.length === 0
            ? (
              <div className="col-span-full card py-16 text-center">
                <FolderKanban className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-2 opacity-40" />
                <p className="text-[var(--text-secondary)] text-sm">No projects found</p>
              </div>
            )
            : projects.map((p) => {
              const priority = PRIORITY_COLORS[p.priority] || PRIORITY_COLORS.Medium;
              return (
                <div key={p.id} className="card hover:border-teal-500/20 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between" style={{ padding: '14px', minHeight: '180px' }}>
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-teal-400 text-[10px] font-mono">{p.project_code}</span>
                          <span className={STATUS_BADGE[p.status] || 'badge-gray'} style={{ fontSize: '8.5px', padding: '1px 5px', borderRadius: '5px' }}>{p.status}</span>
                          <span className={`flex items-center gap-1 text-[10px] font-semibold ${priority.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                            {p.priority}
                          </span>
                        </div>
                        <h3 className="font-bold text-xs leading-tight truncate" style={{ color: 'var(--text-primary)' }} title={p.name}>{p.name}</h3>
                        <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.customer_name}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[10.5px] mb-1">
                        <span className="text-[var(--text-secondary)]">Progress</span>
                        <span className="text-[var(--text-primary)] font-medium">{p.progress || 0}%</span>
                      </div>
                      <ProgressBar value={p.progress} />
                    </div>
                  </div>

                  {/* Meta */}
                  <div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-[var(--text-secondary)] pt-2 border-t border-[var(--border-card)]">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} strokeWidth={2} className="opacity-60 shrink-0" />
                        <span className="truncate">{p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '–'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={11} strokeWidth={2} className="opacity-60 shrink-0" />
                        <span className="truncate">{p.end_date ? new Date(p.end_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '–'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={11} strokeWidth={2} className="opacity-60 shrink-0" />
                        <span className="truncate">{p.team_size || 0} members</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[var(--border-card)] flex items-center justify-between">
                      {p.budget ? (
                        <div>
                          <p className="text-[9px] text-[var(--text-secondary)]">Budget</p>
                          <p className="text-emerald-400 text-xs font-bold">₹{parseFloat(p.budget).toLocaleString('en-IN')}</p>
                        </div>
                      ) : <div />}
                      <button
                        onClick={() => setSelectedProjectForTeam(p)}
                        className="text-[10.5px] font-semibold text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                      >
                        <UserPlus size={11} /> Manage Team
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
        }
      </div>

      {selectedProjectForTeam && (
        <TeamAssignmentModal
          project={selectedProjectForTeam}
          onClose={() => setSelectedProjectForTeam(null)}
          onSaved={fetchProjects}
        />
      )}
    </div>
  );
}
