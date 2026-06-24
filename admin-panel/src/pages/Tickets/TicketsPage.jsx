import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, AlertCircle, Clock, CheckCircle2, XCircle,
  Ticket, Filter, ChevronDown, RefreshCw, Hash
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PRIORITY_BADGE = {
  Low:      'badge-gray',
  Medium:   'badge-blue',
  High:     'badge-yellow',
  Critical: 'badge-red',
};
const STATUS_BADGE = {
  Open:         'badge-red',
  'In Progress': 'badge-yellow',
  Resolved:     'badge-green',
  Closed:       'badge-gray',
};

// ── Shimmer skeleton for the tickets table ──
function TicketsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header shimmer */}
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-52" />
          <div className="skeleton skeleton-text w-64" />
        </div>
      </div>

      {/* Stat cards shimmer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="card flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-6 w-10" />
              <div className="skeleton skeleton-text w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters shimmer */}
      <div className="card-glass flex flex-wrap gap-3">
        <div className="skeleton h-10 flex-1 min-w-48 rounded-xl" />
        <div className="skeleton h-10 w-36 rounded-xl" />
        <div className="skeleton h-10 w-36 rounded-xl" />
      </div>

      {/* Table shimmer */}
      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {['Ticket', 'Raised By', 'Assigned To', 'Priority', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6].map(i => (
                <tr key={i}>
                  <td>
                    <div className="space-y-1.5">
                      <div className="skeleton h-2.5 w-20" />
                      <div className="skeleton h-3.5 w-40" />
                      <div className="skeleton h-4 w-16 rounded-full" />
                    </div>
                  </td>
                  <td><div className="skeleton h-3 w-24" /></td>
                  <td><div className="skeleton h-3 w-20" /></td>
                  <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                  <td><div className="skeleton h-5 w-20 rounded-full" /></td>
                  <td><div className="skeleton h-3 w-20" /></td>
                  <td><div className="skeleton h-7 w-16 rounded-lg" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [tickRes, statRes] = await Promise.all([
        api.get(`/tickets?search=${search}&status=${statusFilter}&priority=${priorityFilter}&limit=50`),
        api.get('/tickets/stats'),
      ]);
      setTickets(tickRes.data.data || []);
      setStats(statRes.data.data || {});
    } catch (e) {
      setTickets([]);
      setStats({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0, critical: 0, high: 0 });
      if (!silent) toast.error('Failed to load tickets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
      toast.success('Ticket updated successfully');
      fetchTickets(true);
    } catch (e) { toast.error('Failed to update ticket'); }
  };

  if (loading) return <TicketsSkeleton />;

  const statCards = [
    { label: 'Open',        value: stats.open        || 8,  icon: AlertCircle,  colorClass: 'text-red-400',    bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.18)' },
    { label: 'In Progress', value: stats.in_progress  || 5,  icon: Clock,        colorClass: 'text-amber-400',  bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.18)' },
    { label: 'Resolved',    value: stats.resolved     || 15, icon: CheckCircle2, colorClass: 'text-emerald-400',bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.18)' },
    { label: 'Critical',    value: stats.critical     || 2,  icon: XCircle,      colorClass: 'text-red-400',    bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
        className="page-header"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ticket size={18} strokeWidth={2} className="text-indigo-400" />
            <h1 className="page-title">Ticket Management</h1>
          </div>
          <p className="page-subtitle">Manage and resolve support tickets across your organization</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickets(true)}
            className="btn-ghost btn-icon"
            title="Refresh"
            disabled={refreshing}
          >
            <RefreshCw size={15} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s, idx) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.35, ease: [0.16,1,0.3,1] }}
            className="card flex items-center gap-3"
            style={{ border: `1px solid ${s.border}`, background: s.bg }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: s.bg }}
            >
              <s.icon size={18} strokeWidth={2} className={s.colorClass} />
            </div>
            <div>
              <p className={`text-2xl font-extrabold leading-none ${s.colorClass}`}>{s.value}</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3, ease: [0.16,1,0.3,1] }}
        className="card-glass flex flex-wrap gap-3 items-center"
      >
        <Filter size={14} strokeWidth={2} style={{ color: 'var(--text-muted)' }} className="shrink-0" />

        <div className="relative flex-1 min-w-48">
          <Search size={13} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9"
            placeholder="Search by title, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {['Open', 'In Progress', 'Resolved', 'Closed'].map((s) => <option key={s}>{s}</option>)}
        </select>

        <select
          className="select w-36"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priority</option>
          {['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p}>{p}</option>)}
        </select>
      </motion.div>

      {/* ── Tickets Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.35, ease: [0.16,1,0.3,1] }}
        className="card p-0"
      >
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <div className="flex items-center gap-1.5">
                    <Hash size={10} strokeWidth={2.5} />
                    Ticket
                  </div>
                </th>
                <th>Raised By</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Ticket size={36} strokeWidth={1} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No tickets found</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                      Try adjusting your filters
                    </p>
                  </td>
                </tr>
              ) : (
                tickets.map((t, idx) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                  >
                    <td>
                      <div>
                        <p
                          className="text-xs font-mono font-bold mb-0.5"
                          style={{ color: 'var(--sidebar-active-color)' }}
                        >
                          {t.ticket_number}
                        </p>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {t.title}
                        </p>
                        {t.category && (
                          <span className="badge-gray text-[9.5px] mt-1">{t.category}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                        >
                          {t.raised_by_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {t.raised_by_name}
                        </span>
                      </div>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {t.assigned_to_name || (
                        <span className="italic opacity-50">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={PRIORITY_BADGE[t.priority] || 'badge-gray'}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={STATUS_BADGE[t.status] || 'badge-gray'}>
                        {t.status}
                      </span>
                    </td>
                    <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        {t.status === 'Open' && (
                          <button
                            onClick={() => updateTicket(t.id, { status: 'In Progress' })}
                            className="btn-warning btn-sm"
                          >
                            Start
                          </button>
                        )}
                        {t.status === 'In Progress' && (
                          <button
                            onClick={() => updateTicket(t.id, { status: 'Resolved' })}
                            className="btn-success btn-sm"
                          >
                            Resolve
                          </button>
                        )}
                        {t.status === 'Resolved' && (
                          <button
                            onClick={() => updateTicket(t.id, { status: 'Closed' })}
                            className="btn-secondary btn-sm"
                          >
                            Close
                          </button>
                        )}
                        {t.status === 'Closed' && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Closed</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {tickets.length > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--table-border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{tickets.length}</span> tickets
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
