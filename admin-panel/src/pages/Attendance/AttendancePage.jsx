import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle,
  Calendar, Download, RefreshCw, Users
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  Present: 'badge-green',
  Late: 'badge-yellow',
  Absent: 'badge-red',
  'Half Day': 'badge-purple',
  Holiday: 'badge-gray',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Shimmer Skeleton ──
function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-56" />
          <div className="skeleton skeleton-text w-48" />
        </div>
        <div className="skeleton skeleton-button w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="card flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-6 w-8" />
              <div className="skeleton skeleton-text w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>{['Employee','Date','Check In','Check Out','Hours','Status'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map(i => (
                <tr key={i}>
                  <td><div className="flex items-center gap-2"><div className="skeleton w-8 h-8 rounded-lg shrink-0" /><div className="space-y-1.5"><div className="skeleton h-3 w-28" /><div className="skeleton h-2.5 w-20" /></div></div></td>
                  <td><div className="skeleton h-3 w-20" /></td>
                  <td><div className="skeleton h-3 w-16" /></td>
                  <td><div className="skeleton h-3 w-16" /></td>
                  <td><div className="skeleton h-3 w-10" /></td>
                  <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [attRes, leaveRes] = await Promise.all([
        api.get(`/attendance?month=${filters.month}&year=${filters.year}&limit=100`),
        api.get('/attendance/leaves'),
      ]);
      setAttendance(attRes.data.data || []);
      setLeaves(leaveRes.data.data || []);
    } catch (e) {
      setAttendance([]);
      setLeaves([]);
      if (!silent) toast.error('Failed to load attendance logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        api.get(`/attendance?month=${filters.month}&year=${filters.year}&limit=100`),
        api.get('/attendance/leaves'),
      ])
        .then(([attRes, leaveRes]) => {
          setAttendance(attRes.data.data || []);
          setLeaves(leaveRes.data.data || []);
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [filters]);

  const approveLeave = async (id, status) => {
    try {
      await api.put(`/attendance/leave/${id}/approve`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      fetchData(true);
    } catch (e) { toast.error('Failed to update leave'); }
  };

  const stats = {
    present: attendance.filter(a => a.status === 'Present').length,
    late:    attendance.filter(a => a.status === 'Late').length,
    absent:  attendance.filter(a => a.status === 'Absent').length,
    pending: leaves.filter(l => l.status === 'Pending').length,
  };

  if (loading) return <AttendanceSkeleton />;

  const statCards = [
    { label: 'Present',      value: stats.present, icon: CheckCircle2, color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)' },
    { label: 'Late',         value: stats.late,    icon: Clock,        color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
    { label: 'Absent',       value: stats.absent,  icon: XCircle,      color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
    { label: 'Leave Pending',value: stats.pending, icon: AlertTriangle, color: '#a78bfa', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }} className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={18} strokeWidth={2} className="text-indigo-400" />
            <h1 className="page-title">Attendance Management</h1>
          </div>
          <p className="page-subtitle">Track employee attendance and manage leave requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchData(true)} className="btn-ghost btn-icon" disabled={refreshing}>
            <RefreshCw size={15} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button className="btn-secondary gap-2">
            <Download size={14} strokeWidth={2} /> Export
          </button>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, idx) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.3, ease: [0.16,1,0.3,1] }}
            className="card flex items-center gap-3"
            style={{ border: `1px solid ${s.border}`, background: s.bg }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon size={18} strokeWidth={2} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs + Date Filter ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3, ease: [0.16,1,0.3,1] }}
        className="flex flex-wrap items-center gap-2"
        style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '0' }}>
        {[
          { key: 'attendance', label: 'Attendance Log', icon: Clock },
          { key: 'leaves', label: `Leave Requests${stats.pending > 0 ? ` (${stats.pending})` : ''}`, icon: Calendar },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all duration-200 relative"
            style={{
              color: activeTab === tab.key ? 'var(--sidebar-active-color)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--sidebar-active-color)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <tab.icon size={14} strokeWidth={2} />
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2">
          <select
            className="select text-xs py-1.5"
            style={{ width: 130 }}
            value={filters.month}
            onChange={e => setFilters({ ...filters, month: parseInt(e.target.value) })}
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input
            type="number"
            className="input text-xs py-1.5"
            style={{ width: 90 }}
            value={filters.year}
            onChange={e => setFilters({ ...filters, year: parseInt(e.target.value) })}
            min="2020" max="2030"
          />
        </div>
      </motion.div>

      {/* ── Attendance Table ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
            className="card p-0"
          >
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th><div className="flex items-center gap-1"><Calendar size={10} strokeWidth={2.5} />Date</div></th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <Clock size={36} strokeWidth={1} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No attendance records for this period</p>
                      </td>
                    </tr>
                  ) : attendance.map((a, idx) => (
                    <motion.tr key={a.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                               style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                            {a.employee_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.employee_name}</p>
                            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{a.employee_code} · {a.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {a.date ? new Date(a.date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="font-mono text-sm" style={{ color: a.check_in ? '#34d399' : 'var(--text-muted)' }}>
                        {a.check_in || '—'}
                      </td>
                      <td className="font-mono text-sm" style={{ color: a.check_out ? '#fbbf24' : 'var(--text-muted)' }}>
                        {a.check_out || '—'}
                      </td>
                      <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {a.working_hours ? `${a.working_hours}h` : '—'}
                      </td>
                      <td>
                        <span className={STATUS_BADGE[a.status] || 'badge-gray'}>{a.status}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {attendance.length > 0 && (
              <div className="flex items-center px-5 py-3" style={{ borderTop: '1px solid var(--table-border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{attendance.length}</span> records for {MONTHS[filters.month - 1]} {filters.year}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Leave Requests Table ── */}
        {activeTab === 'leaves' && (
          <motion.div
            key="leaves"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
            className="card p-0"
          >
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16">
                        <Calendar size={36} strokeWidth={1} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No leave requests found</p>
                      </td>
                    </tr>
                  ) : leaves.map((l, idx) => (
                    <motion.tr key={l.id}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.025, duration: 0.2 }}>
                      <td>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{l.employee_name}</p>
                          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{l.employee_code}</p>
                        </div>
                      </td>
                      <td><span className="badge-blue">{l.leave_type}</span></td>
                      <td className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(l.start_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(l.end_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {l.total_days} day{l.total_days > 1 ? 's' : ''}
                      </td>
                      <td className="text-sm max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{l.reason}</td>
                      <td>
                        <span className={l.status === 'Approved' ? 'badge-green' : l.status === 'Rejected' ? 'badge-red' : 'badge-yellow'}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        {l.status === 'Pending' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => approveLeave(l.id, 'Approved')} className="btn-success btn-sm">Approve</button>
                            <button onClick={() => approveLeave(l.id, 'Rejected')} className="btn-danger btn-sm">Reject</button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
