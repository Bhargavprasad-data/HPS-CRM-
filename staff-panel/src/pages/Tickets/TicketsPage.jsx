import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Ticket, AlertCircle, Clock, CheckCircle, X, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PRIORITY_STYLES = {
  Low:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Medium:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  High:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const STATUS_BADGE = {
  Open:        'badge-red',
  'In Progress':'badge-yellow',
  Resolved:    'badge-green',
  Closed:      'badge-gray',
};
const STATUS_ICON = {
  Open:         <AlertCircle className="w-3 h-3" />,
  'In Progress':<Clock       className="w-3 h-3" />,
  Resolved:     <CheckCircle className="w-3 h-3" />,
  Closed:       <CheckCircle className="w-3 h-3" />,
};

/* ── Skeleton ───────────────────────────────────────────── */
function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-4"><div className="skeleton-text w-20 font-mono" /></td>
      <td className="px-4 py-4">
        <div className="space-y-1.5">
          <div className="skeleton-text w-40" />
          <div className="skeleton-text w-56" />
        </div>
      </td>
      <td className="px-4 py-4"><div className="skeleton w-20 h-5 rounded-lg" /></td>
      <td className="px-4 py-4"><div className="skeleton w-16 h-5 rounded-lg" /></td>
      <td className="px-4 py-4"><div className="skeleton w-20 h-5 rounded-lg" /></td>
      <td className="px-4 py-4"><div className="skeleton-text w-20" /></td>
    </tr>
  );
}

/* ────────────────────────────────────────────────────────── */
export default function TicketsPage() {
  const [tickets,   setTickets]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', category: 'Infrastructure' });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets?limit=50');
      setTickets(res.data.data || []);
    } catch { setTickets([]); toast.error('Failed to load support tickets.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/tickets?limit=50')
        .then(res => {
          setTickets(res.data.data || []);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tickets', form);
      toast.success('Support ticket raised! 🎫');
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'Medium', category: 'Infrastructure' });
      fetchTickets();
    } catch { toast.error('Failed to submit ticket'); }
  };

  const openCount     = tickets.filter((t) => t.status === 'Open').length;
  const progressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">Raise IT or operational tickets and track progress</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Raise Ticket
        </button>
      </div>

      {/* Summary Chips */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          <div className="badge-red gap-2 px-3 py-1.5"><AlertCircle className="w-3 h-3" />{openCount} Open</div>
          <div className="badge-yellow gap-2 px-3 py-1.5"><Clock className="w-3 h-3" />{progressCount} In Progress</div>
          <div className="badge-green gap-2 px-3 py-1.5"><CheckCircle className="w-3 h-3" />{resolvedCount} Resolved</div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-card)] flex items-center gap-2">
          <Ticket className="w-4 h-4 text-violet-400" />
          <h3 className="text-[var(--text-primary)] font-semibold text-sm">All Tickets</h3>
        </div>
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Issue</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                : tickets.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <Ticket className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-[var(--text-secondary)] text-sm">No tickets raised yet</p>
                        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm mt-3">
                          <Plus className="w-3.5 h-3.5" /> Raise First Ticket
                        </button>
                      </td>
                    </tr>
                  )
                  : tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="text-violet-400 font-mono text-sm bg-violet-500/10 px-2 py-0.5 rounded-md">
                          {t.ticket_number || `TKT-${String(t.id).padStart(4,'0')}`}
                        </span>
                      </td>
                      <td>
                        <p className="text-[var(--text-primary)] font-medium text-sm">{t.title}</p>
                        {t.description && (
                          <p className="text-[var(--text-secondary)] text-xs truncate max-w-[220px] mt-0.5">{t.description}</p>
                        )}
                      </td>
                      <td><span className="badge-blue text-xs">{t.category}</span></td>
                      <td>
                        <span className={`badge border text-xs ${PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Medium}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`${STATUS_BADGE[t.status] || 'badge-gray'} gap-1`}>
                          {STATUS_ICON[t.status]} {t.status}
                        </span>
                      </td>
                      <td className="text-[var(--text-secondary)] text-xs">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h2 className="text-[var(--text-primary)] font-bold">Raise Support Ticket</h2>
                  <p className="text-[var(--text-secondary)] text-xs">IT & operational issues</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-2 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="input-group">
                <label className="input-label">Issue Title *</label>
                <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief title of the issue..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {['Infrastructure', 'Email', 'Payroll', 'Access', 'General'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Priority</label>
                  <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Description *</label>
                <textarea className="input h-24 resize-none" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Explain the problem in detail..." />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
