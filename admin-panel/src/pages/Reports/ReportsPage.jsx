import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Download, Calendar, FileSpreadsheet, TrendingUp, Users, IndianRupee, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Shimmer Skeleton ──
function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-48" />
          <div className="skeleton skeleton-text w-64" />
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-4">
            <div className="skeleton w-12 h-12 rounded-2xl mb-4" />
            <div className="skeleton h-5 w-36" />
            <div className="skeleton h-3 w-48 mt-1" />
          </div>
        ))}
      </div>

      {/* Date Range Form & Illustration Skeleton */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="card flex-1 space-y-4">
          <div className="skeleton h-5 w-40 mb-2" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><div className="skeleton h-3 w-16" /><div className="skeleton h-10 w-full rounded-xl" /></div>
            <div className="space-y-2"><div className="skeleton h-3 w-16" /><div className="skeleton h-10 w-full rounded-xl" /></div>
          </div>
          <div className="skeleton h-10 w-full rounded-xl" />
        </div>
        <div className="card flex-1 flex items-center justify-center min-h-[220px]">
          <div className="skeleton h-40 w-40 rounded-2xl" />
        </div>
      </div>

      {/* Quick Reports */}
      <div className="card space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="skeleton h-4 w-10" />
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [form, setForm] = useState({ start_date: '', end_date: '', type: 'attendance' });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    const checkBackend = async () => {
      try {
        await api.get('/reports/dashboard');
        if (active) setLoading(false);
      } catch (e) {
        if (active) setTimeout(checkBackend, 3000);
      }
    };
    checkBackend();
    return () => { active = false; };
  }, []);

  const generate = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) { toast.error('Please select date range'); return; }
    setGenerating(true);
    try {
      let res;
      if (form.type === 'attendance') {
        res = await api.get(`/reports/attendance?start_date=${form.start_date}&end_date=${form.end_date}&format=excel`);
      } else if (form.type === 'revenue') {
        res = await api.get(`/reports/revenue?start_date=${form.start_date}&end_date=${form.end_date}`);
        toast.success(`Revenue report generated — ${res.data.data?.length || 0} records`);
        return;
      } else if (form.type === 'payroll') {
        const month = new Date(form.start_date).getMonth() + 1;
        const year = new Date(form.start_date).getFullYear();
        res = await api.get(`/reports/payroll?month=${month}&year=${year}&format=excel`);
      }
      if (res?.data?.data?.fileUrl) {
        toast.success('Report generated! Opening file...');
        window.open(`http://localhost:5000${res.data.data.fileUrl}`, '_blank');
      }
    } catch (e) { toast.error('Failed to generate report. Connect the backend first.'); }
    finally { setGenerating(false); }
  };

  if (loading) return <ReportsSkeleton />;

  const REPORT_TYPES = [
    {
      id: 'attendance',
      label: 'Attendance Report',
      desc: 'Daily check-in/out records for date range',
      icon: Users,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      shadowColor: 'rgba(99, 102, 241, 0.2)'
    },
    {
      id: 'payroll',
      label: 'Payroll Report',
      desc: 'Salary breakdown for selected month',
      icon: IndianRupee,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.2)'
    },
    {
      id: 'revenue',
      label: 'Revenue Report',
      desc: 'Invoice and payment tracking',
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.2)'
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="page-header"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={18} strokeWidth={2} className="text-indigo-400" />
            <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>Reports & Analytics</h1>
          </div>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Export organization database metrics and parameters directly to spreadsheet files</p>
        </div>
      </motion.div>

      {/* ── Report Type Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TYPES.map((r, idx) => {
          const isSelected = form.type === r.id;
          return (
            <motion.button
              key={r.id}
              onClick={() => setForm({ ...form, type: r.id })}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="card text-left transition-all duration-300 relative overflow-hidden group cursor-pointer"
              style={{
                border: isSelected ? '1px solid var(--sidebar-active-color)' : '1px solid var(--border-card)',
                background: isSelected ? 'var(--bg-active)' : 'var(--bg-card)',
                boxShadow: isSelected ? `0 12px 32px ${r.shadowColor}` : 'none',
              }}
              whileHover={{ y: -3, borderColor: 'var(--border-card-hover)', boxShadow: `0 8px 24px ${isSelected ? r.shadowColor : 'rgba(0,0,0,0.1)'}` }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: r.gradient,
                  boxShadow: `0 4px 14px ${r.shadowColor}`,
                }}
              >
                <r.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>{r.label}</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.desc}</p>
              
              {isSelected ? (
                <div 
                  className="absolute top-4 right-4 flex items-center justify-center w-5 h-5 rounded-full"
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid var(--sidebar-active-color)',
                    color: 'var(--sidebar-active-color)',
                  }}
                >
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                </div>
              ) : (
                <ChevronRight 
                  size={14} 
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-50 transition-opacity" 
                  style={{ color: 'var(--text-muted)' }} 
                />
              )}

              {/* Glowing gradient back decoration */}
              <div
                className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-[0.06] pointer-events-none transition-opacity duration-300 group-hover:opacity-10"
                style={{ background: r.gradient }}
              />
            </motion.button>
          );
        })}
      </div>

      {/* ── Date Range Form & Illustration ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="card flex-1 relative overflow-hidden"
          style={{ borderTop: '2px solid var(--sidebar-active-color)' }}
        >
          <h3 className="font-bold text-sm mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="w-4 h-4 text-indigo-400" />
            Filter Parameters
          </h3>
          <form onSubmit={generate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>Start Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    className="input pl-3"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>End Date *</label>
                <div className="relative">
                  <input
                    type="date"
                    className="input pl-3"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={generating}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2.5 transition-all duration-200 relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {generating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-white" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">Generate & Download Excel Report</span>
            </motion.button>
          </form>
        </motion.div>

        {/* Illustration Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="card flex-1 p-0 relative overflow-hidden min-h-[240px]"
          style={{ border: '1px solid var(--border-card)' }}
        >
          <img
            src="/reports_illustration.png"
            alt="Reports & Analytics"
            className="w-full h-full object-cover absolute inset-0 transition-transform duration-300 hover:scale-105"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </motion.div>
      </div>

      {/* ── Quick Report Links ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="card-glass"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Zap size={14} className="text-amber-400" />
            Quick Access Templates
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Today\'s Attendance', desc: 'Real-time check-in status', color: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)', path: '/attendance' },
            { label: 'Monthly Payroll', desc: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, color: 'var(--badge-green-border)', text: 'var(--badge-green-text)', path: '/payroll' },
            { label: 'Open Tickets', desc: 'Unresolved issues', color: 'var(--badge-red-border)', text: 'var(--badge-red-text)', path: '/tickets' },
            { label: 'Project Progress', desc: 'Active project statuses', color: 'var(--badge-yellow-border)', text: 'var(--badge-yellow-text)', path: '/projects' },
          ].map((q, idx) => (
            <motion.div
              key={q.label}
              onClick={() => window.location.href = q.path}
              className="rounded-2xl p-4 transition-all duration-200 border cursor-pointer hover:-translate-y-1 relative group"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-card-hover)';
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-card)';
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              whileHover={{ scale: 1.02 }}
            >
              <span 
                className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block mb-3"
                style={{
                  background: 'rgba(0,0,0,0.02)',
                  border: `1px solid ${q.color}`,
                  color: q.text
                }}
              >
                Template
              </span>
              <p className="text-xs font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{q.label}</p>
              <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>{q.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
