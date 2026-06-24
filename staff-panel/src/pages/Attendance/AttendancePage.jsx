import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, XCircle, Timer, Download, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckInWidget } from '../../layouts/StaffLayout';

const STATUS_BADGE = {
  Present:  'badge-green',
  Late:     'badge-yellow',
  Absent:   'badge-red',
  'Half Day': 'badge-purple',
};

/* ── Skeletons ──────────────────────────────────────────── */
function StatSkeleton() {
  return (
    <div className="stat-card border border-[var(--border-card)]">
      <div className="skeleton stat-icon w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-text w-24" />
        <div className="skeleton w-10 h-7 rounded-lg" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-4"><div className="skeleton-text w-36" /></td>
      <td className="px-4 py-4"><div className="skeleton-text w-16" /></td>
      <td className="px-4 py-4"><div className="skeleton-text w-16" /></td>
      <td className="px-4 py-4"><div className="skeleton-text w-20" /></td>
      <td className="px-4 py-4"><div className="skeleton w-16 h-6 rounded-lg" /></td>
    </tr>
  );
}

/* ────────────────────────────────────────────────────────── */
export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filters,    setFilters]    = useState({
    month: new Date().getMonth() + 1,
    year:  new Date().getFullYear(),
  });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/attendance?month=${filters.month}&year=${filters.year}&limit=100`);
      setAttendance(res.data.data || []);
    } catch {
      setAttendance([]);
      if (!silent) toast.error('Failed to load attendance logs.');
    } finally { if (!silent) setLoading(false); }
  }, [filters]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const stats = {
    present: attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length,
    late:    attendance.filter((a) => a.status === 'Late').length,
    absent:  attendance.filter((a) => a.status === 'Absent').length,
    hours:   attendance.reduce((s, a) => s + parseFloat(a.working_hours || 0), 0).toFixed(1),
  };

  const STATS = [
    { label: 'Present Days',       value: stats.present,    icon: CheckCircle2, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/10' },
    { label: 'Late Clock-ins',     value: stats.late,       icon: Clock,        colorClass: 'text-amber-400',   bgClass: 'bg-amber-500/10',   borderClass: 'border-amber-500/10'   },
    { label: 'Absent Days',        value: stats.absent,     icon: XCircle,      colorClass: 'text-red-400',     bgClass: 'bg-red-500/10',     borderClass: 'border-red-500/10'     },
    { label: 'Total Hours Worked', value: `${stats.hours}h`,icon: Timer,        colorClass: 'text-blue-400',    bgClass: 'bg-blue-500/10',    borderClass: 'border-blue-500/10'    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Check-in history and working hours log</p>
        </div>
      </div>

      {/* Check-in Widget */}
      <CheckInWidget onClockChange={fetchData} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : STATS.map((s) => (
            <div key={s.label} className={`stat-card border ${s.borderClass}`}>
              <div className={`stat-icon ${s.bgClass}`}>
                <s.icon className={`w-5 h-5 ${s.colorClass}`} />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-xs font-medium">{s.label}</p>
                <p className="text-[var(--text-primary)] text-2xl font-bold mt-0.5">{s.value}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Table Card */}
      <div className="card p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-card)] flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-violet-400" />
            <h3 className="text-[var(--text-primary)] font-semibold text-sm">Attendance Log</h3>
          </div>
          <div className="flex gap-2">
            <select
              className="input w-36 text-xs py-1.5 px-3 h-auto"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
            >
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input
              type="number"
              className="input w-24 text-xs py-1.5 px-3 h-auto"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              min="2020" max="2030"
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} />)
                : attendance.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-[var(--text-secondary)] text-sm">No attendance records for this period</p>
                      </td>
                    </tr>
                  )
                  : attendance.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="text-[var(--text-primary)] font-medium">
                          {a.date ? new Date(a.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' }) : '-'}
                        </span>
                      </td>
                      <td className="font-mono text-sm text-[var(--text-primary)]">{a.check_in || '—'}</td>
                      <td className="font-mono text-sm text-[var(--text-primary)]">{a.check_out || '—'}</td>
                      <td className="text-[var(--text-secondary)] text-sm">
                        {a.working_hours ? `${parseFloat(a.working_hours).toFixed(2)} hrs` : '—'}
                      </td>
                      <td>
                        <span className={STATUS_BADGE[a.status] || 'badge-gray'}>{a.status}</span>
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
