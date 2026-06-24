import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, FolderKanban, Ticket, Clock, TrendingUp, CheckCircle2,
  AlertCircle, ArrowUpRight, Target, Activity, Zap
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/* ── Skeleton Components ──────────────────────────────────── */
function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="skeleton stat-icon w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-text w-20" />
        <div className="skeleton w-14 h-7 rounded-lg" />
        <div className="skeleton-text w-16" />
      </div>
    </div>
  );
}

function CardSkeleton({ h = 220 }) {
  return (
    <div className="card space-y-3">
      <div className="skeleton-text w-40" />
      <div className="skeleton rounded-xl" style={{ height: h }} />
    </div>
  );
}

function RowSkeleton() {
  return (
    <tr>
      {[120, 80, 70, 70].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton-text" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Tooltip customization ─────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card-glass)', color: 'var(--text-primary)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-teal-400 font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

/* ── Quick Action ──────────────────────────────────────────── */
function QuickCard({ label, icon: Icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] hover:border-teal-500/20 transition-all duration-200 group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} transition-transform duration-200 group-hover:scale-110`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[var(--text-secondary)] text-xs font-medium group-hover:text-[var(--text-primary)] transition-colors">{label}</span>
    </button>
  );
}

/* ── Main Dashboard ────────────────────────────────────────── */
export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [projectData, setProjectData] = useState([]);
  const [attendance,  setAttendance]  = useState([]);
  const [taskData,    setTaskData]    = useState([]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';

  useEffect(() => {
    let active = true;
    let timeoutId;

    const fetchStats = async () => {
      try {
        const [statsRes, projectsRes, attRes, allProjRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/projects?limit=5'),
          api.get('/attendance/today'),
          api.get('/projects?limit=200')
        ]);
        
        if (!active) return;
        setStats(statsRes.data.data);
        
        const projData = (projectsRes.data.data || []).map(p => ({
          id: p.id,
          name: p.name,
          client: p.customer_name || 'Internal',
          progress: p.progress != null ? p.progress : (p.status === 'Completed' ? 100 : p.status === 'In Progress' ? 50 : 0),
          status: p.status,
          cls: p.status === 'Completed' ? 'badge-green' : p.status === 'In Progress' ? 'badge-blue' : 'badge-yellow'
        }));
        setProjectData(projData);
        
        const attData = (attRes.data.data || []).map(a => ({
          code: a.employee_code,
          name: a.name || a.employee_name,
          check_in: a.check_in,
          status: a.status,
          dept: a.department || 'General'
        }));
        setAttendance(attData);

        // Aggregate tasks (projects) for chart
        const allProjs = allProjRes.data.data || [];
        const monthMap = {};
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const today = new Date();
        for(let i=5; i>=0; i--) {
           const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
           monthMap[months[d.getMonth()]] = { month: months[d.getMonth()], tasks: 0, completed: 0 };
        }
        allProjs.forEach(p => {
           const d = new Date(p.created_at || new Date());
           const m = months[d.getMonth()];
           if (monthMap[m]) {
             monthMap[m].tasks += 1;
             if (p.status === 'Completed') monthMap[m].completed += 1;
           }
        });
        setTaskData(Object.values(monthMap));
        
        setLoading(false);
        timeoutId = setTimeout(fetchStats, 10000); // 10s poll
      } catch {
        if (!active) return;
        timeoutId = setTimeout(fetchStats, 10000);
      }
    };

    fetchStats();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const STATS = [
    {
      title: 'Team Members', value: stats?.employees?.active ?? 12,
      icon: Users, sub: 'Active employees',
      colorClass: 'text-teal-400', bgClass: 'bg-teal-500/10', borderClass: 'border-teal-500/10',
    },
    {
      title: 'Active Projects', value: stats?.projects?.in_progress ?? 7,
      icon: FolderKanban, sub: `${stats?.projects?.overdue ?? 2} overdue`,
      colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/10',
    },
    {
      title: 'Open Tickets', value: stats?.tickets?.open ?? 8,
      icon: Ticket, sub: `${stats?.tickets?.critical ?? 2} critical`,
      colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/10',
    },
    {
      title: 'Present Today', value: stats?.attendance?.today_present ?? 9,
      icon: Clock, sub: `${stats?.attendance?.today_late ?? 2} late`,
      colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Greeting ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-gradient">{greeting},</span>{' '}
            <span className="text-[var(--text-primary)]">{user?.name?.split(' ')[0]}!</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Here's what's happening in your organization today
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl text-xs text-[var(--text-secondary)]">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1,2,3,4].map(i => <StatSkeleton key={i} />)
          : STATS.map((s) => (
            <div key={s.title} className={`stat-card border ${s.borderClass}`}>
              <div className={`stat-icon ${s.bgClass}`}>
                <s.icon className={`w-5 h-5 ${s.colorClass}`} />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-xs font-medium">{s.title}</p>
                <p className={`text-2xl font-bold mt-0.5 ${s.colorClass}`}>{s.value}</p>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        {loading ? <CardSkeleton /> : (
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[var(--text-primary)] font-semibold">Team Task Completion</h3>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5">Monthly assignments vs completions</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-400 text-xs font-semibold">Live</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="tasks"     name="Assigned"  fill="#0d9488" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Bar dataKey="completed" name="Completed" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Project Status Overview */}
        {loading ? <CardSkeleton /> : (
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[var(--text-primary)] font-semibold">Project Status</h3>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5">Active project progress</p>
              </div>
              <button
                onClick={() => navigate('/projects')}
                className="flex items-center gap-1 text-teal-400 hover:text-teal-300 text-xs font-medium transition-colors"
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {projectData.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-secondary)]">No active projects</div>
              ) : projectData.map((p) => (
                <div key={p.id || p.name} className="p-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-[var(--text-primary)] text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[var(--text-secondary)] text-xs">{p.client}</p>
                    </div>
                    <span className={p.cls}>{p.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[var(--border-card)] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-[var(--text-secondary)] text-xs font-mono w-8 text-right">{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance table */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <h3 className="text-[var(--text-primary)] font-semibold text-sm">Today's Attendance</h3>
            </div>
            <button onClick={() => navigate('/team')} className="text-teal-400 hover:text-teal-300 text-xs font-medium transition-colors flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="table-wrapper border-0 rounded-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th><th>Check In</th><th>Status</th><th>Department</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [1,2,3,4].map(i => <RowSkeleton key={i} />)
                  : attendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-xs text-[var(--text-secondary)]">No attendance recorded today</td>
                    </tr>
                  ) : attendance.map((a) => (
                    <tr key={a.code}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {a.name[0]}
                          </div>
                          <div>
                            <p className="text-[var(--text-primary)] text-sm font-medium">{a.name}</p>
                            <p className="text-[var(--text-secondary)] text-xs">{a.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-sm text-[var(--text-secondary)]">
                        {a.check_in ? new Date(`1970-01-01T${a.check_in}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                      </td>
                      <td>
                        <span className={a.status === 'Present' ? 'badge-green' : a.status === 'Late' ? 'badge-yellow' : 'badge-red'}>
                          {a.status}
                        </span>
                      </td>
                      <td className="text-[var(--text-secondary)] text-sm">{a.dept}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-teal-400" />
            <h3 className="text-[var(--text-primary)] font-semibold text-sm">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <QuickCard label="Team"     icon={Users}        color="bg-teal-500/15 text-teal-400"    onClick={() => navigate('/team')} />
            <QuickCard label="Projects" icon={FolderKanban} color="bg-blue-500/15 text-blue-400"    onClick={() => navigate('/projects')} />
            <QuickCard label="Tasks"    icon={Target}       color="bg-purple-500/15 text-purple-400" onClick={() => navigate('/tasks')} />
            <QuickCard label="Reports"  icon={TrendingUp}   color="bg-emerald-500/15 text-emerald-400" onClick={() => navigate('/reports')} />
          </div>

          {/* Mini KPIs */}
          <div className="mt-4 pt-4 border-t border-[var(--border-card)] space-y-2.5">
            {[
              { label: 'Tasks Due Today',  val: 5,  cls: 'text-amber-400'  },
              { label: 'Unresolved Tickets', val: 8, cls: 'text-red-400'   },
              { label: 'Projects On Track', val: 6,  cls: 'text-emerald-400' },
            ].map((k) => (
              <div key={k.label} className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-xs">{k.label}</span>
                <span className={`text-sm font-bold ${k.cls}`}>{k.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
