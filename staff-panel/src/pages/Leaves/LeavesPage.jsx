import { useState, useEffect } from 'react';
import { Calendar, Plus, X, CheckCircle, Clock, XCircle, Info } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ── Skeletons ──────────────────────────────────────────── */
function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-4"><div className="skeleton w-16 h-6 rounded-lg" /></td>
      <td className="px-4 py-4"><div className="skeleton-text w-24" /></td>
      <td className="px-4 py-4"><div className="skeleton-text w-24" /></td>
      <td className="px-4 py-4"><div className="skeleton-text w-12" /></td>
      <td className="px-4 py-4"><div className="skeleton-text w-36" /></td>
      <td className="px-4 py-4"><div className="skeleton w-20 h-6 rounded-lg" /></td>
    </tr>
  );
}

const STATUS_ICON = {
  Approved: <CheckCircle className="w-3 h-3" />,
  Rejected: <XCircle    className="w-3 h-3" />,
  Pending:  <Clock      className="w-3 h-3" />,
};

/* ────────────────────────────────────────────────────────── */
export default function LeavesPage() {
  const [leaves,     setLeaves]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [form, setForm] = useState({ leave_type: 'Casual', start_date: '', end_date: '', reason: '' });

  useEffect(() => { fetchLeaves(); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get('/attendance/leaves?limit=50')
        .then(res => {
          setLeaves(res.data.data || []);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/leaves?limit=50');
      setLeaves(res.data.data || []);
    } catch { setLeaves([]); toast.error('Failed to load leave history.'); }
    finally { setLoading(false); }
  };

  const applyLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/leave', form);
      toast.success('Leave application submitted!');
      setShowModal(false);
      setForm({ leave_type: 'Casual', start_date: '', end_date: '', reason: '' });
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit application'); }
  };

  const summary = {
    total:    leaves.length,
    approved: leaves.filter((l) => l.status === 'Approved').length,
    pending:  leaves.filter((l) => l.status === 'Pending').length,
    rejected: leaves.filter((l) => l.status === 'Rejected').length,
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Applications</h1>
          <p className="page-subtitle">Request leaves and monitor authorization pipeline</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* Summary chips */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total Requests',  value: summary.total,    cls: 'badge-gray'   },
            { label: 'Approved',        value: summary.approved, cls: 'badge-green'  },
            { label: 'Pending',         value: summary.pending,  cls: 'badge-yellow' },
            { label: 'Rejected',        value: summary.rejected, cls: 'badge-red'    },
          ].map((s) => (
            <div key={s.label} className={`${s.cls} gap-2 px-3 py-1.5`}>
              <span className="font-bold">{s.value}</span> {s.label}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-card)] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h3 className="text-[var(--text-primary)] font-semibold text-sm">Leave History</h3>
        </div>
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                : leaves.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-[var(--text-secondary)] text-sm">No leave requests found</p>
                        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm mt-3">
                          <Plus className="w-3.5 h-3.5" /> Apply Now
                        </button>
                      </td>
                    </tr>
                  )
                  : leaves.map((l) => (
                    <tr key={l.id}>
                      <td><span className="badge-blue">{l.leave_type}</span></td>
                      <td className="text-[var(--text-primary)]">{new Date(l.start_date).toLocaleDateString('en-IN')}</td>
                      <td className="text-[var(--text-primary)]">{new Date(l.end_date).toLocaleDateString('en-IN')}</td>
                      <td className="text-[var(--text-primary)] font-semibold">{l.total_days}d</td>
                      <td className="text-[var(--text-secondary)] text-sm max-w-[180px] truncate">{l.reason}</td>
                      <td>
                        <span className={`${l.status === 'Approved' ? 'badge-green' : l.status === 'Rejected' ? 'badge-red' : 'badge-yellow'} gap-1`}>
                          {STATUS_ICON[l.status]} {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-[var(--text-primary)] font-bold">Apply for Leave</h2>
                  <p className="text-[var(--text-secondary)] text-xs">Fill in the request details</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-2 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={applyLeave} className="p-6 space-y-4">
              <div className="input-group">
                <label className="input-label">Leave Type</label>
                <select className="select" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
                  {['Casual', 'Sick', 'Earned', 'Maternity', 'Emergency'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label">From Date</label>
                  <input type="date" className="input" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">To Date</label>
                  <input type="date" className="input" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Reason</label>
                <textarea className="input resize-none h-24" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="State details for manager approval..." />
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-amber-400/80 text-xs">Leave applications are subject to manager approval.</p>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
