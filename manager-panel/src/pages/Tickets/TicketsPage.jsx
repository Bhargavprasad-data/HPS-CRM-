import { useState, useEffect, useCallback } from 'react';
import { Search, AlertCircle, Clock, CheckCircle, Ticket } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PRIORITY_STYLES = {
  Low:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Medium:   'bg-blue-500/10  text-blue-400  border-blue-500/20',
  High:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Critical: 'bg-red-500/10   text-red-400   border-red-500/20',
};
const STATUS_BADGE = {
  Open:        'badge-red',
  'In Progress': 'badge-yellow',
  Resolved:    'badge-green',
  Closed:      'badge-gray',
};

/* ── Skeletons ────────────────────────────────────────────── */
function StatSkeleton() {
  return (
    <div className="stat-card border border-[var(--border-card)]">
      <div className="skeleton stat-icon w-12 h-12 rounded-xl" />
      <div className="space-y-2 flex-1">
        <div className="skeleton-text w-16" />
        <div className="skeleton w-10 h-7 rounded-lg" />
      </div>
    </div>
  );
}
function RowSkeleton() {
  return (
    <tr>
      {[160, 100, 100, 80, 80, 80, 80].map((w, i) => (
        <td key={i} className="px-4 py-4"><div className="skeleton-text" style={{ width: w }} /></td>
      ))}
    </tr>
  );
}

export default function TicketsPage() {
  const [tickets,       setTickets]       = useState([]);
  const [stats,         setStats]         = useState({});
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [priorityFilter,setPriorityFilter] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const [tickRes, statRes] = await Promise.all([
        api.get(`/tickets?search=${search}&status=${statusFilter}&priority=${priorityFilter}&limit=50`),
        api.get('/tickets/stats'),
      ]);
      setTickets(tickRes.data.data || []);
      setStats(statRes.data.data || {});
    } catch {
      setTickets([]);
      setStats({});
      toast.error('Failed to load tickets.');
    } finally { setLoading(false); }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        api.get(`/tickets?search=${search}&status=${statusFilter}&priority=${priorityFilter}&limit=50`),
        api.get('/tickets/stats'),
      ])
        .then(([tickRes, statRes]) => {
          setTickets(tickRes.data.data || []);
          setStats(statRes.data.data || {});
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [search, statusFilter, priorityFilter]);

  const updateTicket = async (id, updates) => {
    try {
      await api.put(`/tickets/${id}`, updates);
      toast.success('Ticket updated');
      fetchTickets();
    } catch { toast.error('Failed to update'); }
  };

  const STAT_CARDS = [
    { label: 'Open',       value: stats.open       || 0, icon: AlertCircle,  cls: 'text-red-400    bg-red-500/10    border-red-500/20'    },
    { label: 'In Progress',value: stats.in_progress || 0, icon: Clock,       cls: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
    { label: 'Resolved',   value: stats.resolved   || 0, icon: CheckCircle, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Critical',   value: stats.critical   || 0, icon: AlertCircle,  cls: 'text-red-400    bg-red-900/30    border-red-500/30'     },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ticket Management</h1>
          <p className="page-subtitle">Manage and resolve team support tickets</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading
          ? [1,2,3,4].map(i => <StatSkeleton key={i} />)
          : STAT_CARDS.map((s) => (
            <div key={s.label} className={`stat-card border flex items-center gap-3 ${s.cls}`}>
              <div className={`stat-icon ${s.cls.split(' ').slice(1).join(' ')}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs opacity-70">{s.label}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Filters */}
      <div className="card-glass flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input className="input pl-9" placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['Open','In Progress','Resolved','Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select w-36" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priority</option>
          {['Low','Medium','High','Critical'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th><th>Raised By</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1,2,3,4,5].map(i => <RowSkeleton key={i} />)
                : tickets.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <Ticket className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-2 opacity-40" />
                        <p className="text-[var(--text-secondary)] text-sm">No tickets found</p>
                      </td>
                    </tr>
                  )
                  : tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <p className="text-teal-400 text-xs font-mono mb-0.5">{t.ticket_number}</p>
                        <p className="text-[var(--text-primary)] font-medium text-sm">{t.title}</p>
                        {t.category && <span className="badge-gray text-xs mt-0.5">{t.category}</span>}
                      </td>
                      <td className="text-[var(--text-primary)] text-sm">{t.raised_by_name}</td>
                      <td className="text-[var(--text-secondary)] text-sm">{t.assigned_to_name || '—'}</td>
                      <td>
                        <span className={`badge border ${PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium}`}>{t.priority}</span>
                      </td>
                      <td><span className={STATUS_BADGE[t.status] || 'badge-gray'}>{t.status}</span></td>
                      <td className="text-[var(--text-secondary)] text-xs">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div className="flex gap-1">
                          {t.status === 'Open' && (
                            <button onClick={() => updateTicket(t.id, { status: 'In Progress' })} className="btn-warning btn-sm">Start</button>
                          )}
                          {t.status === 'In Progress' && (
                            <button onClick={() => updateTicket(t.id, { status: 'Resolved' })} className="btn-success btn-sm">Resolve</button>
                          )}
                          {t.status === 'Resolved' && (
                            <button onClick={() => updateTicket(t.id, { status: 'Closed' })} className="btn-secondary btn-sm">Close</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
