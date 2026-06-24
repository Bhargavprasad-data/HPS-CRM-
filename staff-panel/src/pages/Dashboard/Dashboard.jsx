import { useState, useEffect } from 'react';
import {
  Clock, Calendar, FileText, Ticket, CheckCircle2, AlertCircle,
  TrendingUp, Users, Zap, ArrowRight, Briefcase
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckInWidget } from '../../layouts/StaffLayout';
import api from '../../services/api';

/* ── Skeleton ─────────────────────────────────────────────── */
function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="skeleton stat-icon w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-text w-16" />
        <div className="skeleton w-8 h-6 rounded-lg" />
      </div>
    </div>
  );
}

function AttendanceRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-input)]">
      <div className="space-y-1.5">
        <div className="skeleton-text w-32" />
        <div className="skeleton-text w-24" />
      </div>
      <div className="skeleton w-16 h-6 rounded-lg" />
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, colorClass, bgClass, borderClass, loading }) {
  if (loading) return <StatCardSkeleton />;
  return (
    <div className={`stat-card border ${borderClass}`}>
      <div className={`stat-icon ${bgClass}`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div>
        <p className="text-[var(--text-secondary)] text-xs font-medium">{label}</p>
        <p className="text-[var(--text-primary)] text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ── Quick Action Card ────────────────────────────────────── */
function QuickAction({ label, icon: Icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] hover:border-violet-500/20 transition-all duration-200 group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} transition-transform duration-200 group-hover:scale-110`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[var(--text-secondary)] text-xs font-medium group-hover:text-[var(--text-primary)] transition-colors">{label}</span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────── */
export default function StaffDashboard() {
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'Casual', start_date: '', end_date: '', reason: '' });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';

  useEffect(() => {
    let active = true;
    let timeoutId;
    let intervalId;

    const load = async () => {
      try {
        const [aRes, lRes] = await Promise.all([
          api.get('/attendance?limit=10'),
          api.get('/attendance/leaves?limit=5'),
        ]);
        if (!active) return;
        setAttendance(aRes.data.data || []);
        setLeaves(lRes.data.data || []);
        setLoading(false);
        if (!intervalId) {
          intervalId = setInterval(load, 5000);
        }
      } catch {
        if (!active) return;
        timeoutId = setTimeout(load, 5000);
      }
    };

    load();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const applyLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/leave', leaveForm);
      toast.success('Leave request submitted!');
      setShowLeaveModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const presentDays = attendance.filter((a) => a.status === 'Present').length;
  const lateDays    = attendance.filter((a) => a.status === 'Late').length;
  const pendLeaves  = leaves.filter((l) => l.status === 'Pending').length;

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
            Here's what's happening on your dashboard today
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl text-xs text-[var(--text-secondary)]">
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* ── Check-In Widget ── */}
      <CheckInWidget />

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={loading} label="Present This Month" value={presentDays}
          icon={CheckCircle2}
          colorClass="text-emerald-400" bgClass="bg-emerald-500/10"
          borderClass="border-emerald-500/10" />
        <StatCard loading={loading} label="Late Clock-ins" value={lateDays}
          icon={Clock}
          colorClass="text-amber-400" bgClass="bg-amber-500/10"
          borderClass="border-amber-500/10" />
        <StatCard loading={loading} label="Pending Leaves" value={pendLeaves}
          icon={Calendar}
          colorClass="text-blue-400" bgClass="bg-blue-500/10"
          borderClass="border-blue-500/10" />
        <StatCard loading={loading} label="Open Tickets" value={2}
          icon={Ticket}
          colorClass="text-violet-400" bgClass="bg-violet-500/10"
          borderClass="border-violet-500/10" />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Attendance Timeline */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <h3 className="text-[var(--text-primary)] font-semibold text-sm">Recent Attendance</h3>
            </div>
            <button onClick={() => navigate('/attendance')} className="flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <AttendanceRowSkeleton key={i} />)
            ) : attendance.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-[var(--text-secondary)] text-sm">No attendance records yet</p>
              </div>
            ) : attendance.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-[var(--bg-input)] rounded-xl hover:bg-[var(--bg-hover)] transition-colors group">
                <div>
                  <p className="text-[var(--text-primary)] text-sm font-medium">
                    {new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-[var(--text-secondary)] text-xs font-mono mt-0.5">
                    {a.check_in || '—'} → {a.check_out || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={a.status === 'Present' ? 'badge-green' : a.status === 'Late' ? 'badge-yellow' : 'badge-red'}>
                    {a.status}
                  </span>
                  {a.working_hours && (
                    <p className="text-[var(--text-secondary)] text-xs mt-1">{parseFloat(a.working_hours).toFixed(1)}h</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-violet-400" />
              <h3 className="text-[var(--text-primary)] font-semibold text-sm">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction label="Apply Leave"  icon={Calendar}    color="bg-blue-500/15 text-blue-400"    onClick={() => setShowLeaveModal(true)} />
              <QuickAction label="Raise Ticket" icon={Ticket}      color="bg-amber-500/15 text-amber-400"  onClick={() => navigate('/tickets')} />
              <QuickAction label="View Payslip" icon={FileText}    color="bg-emerald-500/15 text-emerald-400" onClick={() => navigate('/payslips')} />
              <QuickAction label="My Projects"  icon={Briefcase}   color="bg-violet-500/15 text-violet-400" onClick={() => navigate('/projects')} />
            </div>
          </div>

          {/* Leave Status */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h3 className="text-[var(--text-primary)] font-semibold text-sm">Leave Requests</h3>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-[var(--bg-input)] rounded-xl">
                    <div className="space-y-1.5">
                      <div className="skeleton-text w-20" />
                      <div className="skeleton-text w-28" />
                    </div>
                    <div className="skeleton w-16 h-6 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : leaves.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm text-center py-3">No leave requests</p>
            ) : (
              <div className="space-y-2">
                {leaves.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-2.5 bg-[var(--bg-input)] rounded-xl">
                    <div>
                      <p className="text-[var(--text-primary)] text-sm">{l.leave_type} Leave</p>
                      <p className="text-[var(--text-secondary)] text-xs">
                        {new Date(l.start_date).toLocaleDateString('en-IN')} – {new Date(l.end_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <span className={l.status === 'Approved' ? 'badge-green' : l.status === 'Rejected' ? 'badge-red' : 'badge-yellow'}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Leave Modal ── */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-[var(--text-primary)] font-bold">Apply for Leave</h2>
                  <p className="text-[var(--text-secondary)] text-xs">Fill in the details below</p>
                </div>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="btn-ghost p-2 rounded-xl">
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={applyLeave} className="p-6 space-y-4">
              <div className="input-group">
                <label className="input-label">Leave Type</label>
                <select className="select" value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                  {['Casual', 'Sick', 'Earned', 'Maternity', 'Emergency'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="input-group">
                  <label className="input-label">From Date</label>
                  <input type="date" className="input" required value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">To Date</label>
                  <input type="date" className="input" required value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Reason</label>
                <textarea className="input resize-none h-24" required value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Reason for leave..." />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
