import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, UserCheck, FolderKanban, Ticket, TrendingUp,
  IndianRupee, Clock, AlertCircle, CheckCircle2, ArrowUpRight,
  ArrowDownRight, Activity, Calendar, Zap,
  FileText, Eye, ChevronRight
} from 'lucide-react';
import api from '../../services/api';

// ── Animated Counter ──
const AnimatedNumber = ({ value, prefix = '', suffix = '', duration = 900 }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(value) || 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{prefix}{display.toLocaleString('en-IN')}{suffix}</>;
};

// ── Shimmer Skeleton for Dashboard ──
function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header shimmer */}
      <div className="flex justify-between items-center">
        <div className="space-y-2.5">
          <div className="skeleton h-7 w-72" />
          <div className="skeleton h-3.5 w-56" />
        </div>
        <div className="skeleton h-7 w-28 rounded-full" />
      </div>

      {/* Welcome banner shimmer */}
      <div className="skeleton h-24 w-full rounded-2xl" />

      {/* 4-col stat cards shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="card flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="skeleton h-2.5 w-20" />
              <div className="skeleton h-8 w-16" />
              <div className="skeleton h-2.5 w-28" />
              <div className="skeleton h-3 w-20" />
            </div>
            <div className="skeleton w-11 h-11 rounded-2xl shrink-0" />
          </div>
        ))}
      </div>

      {/* Revenue mini cards shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="card-glass flex items-center gap-4">
            <div className="skeleton w-11 h-11 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-2.5 w-24" />
              <div className="skeleton h-5 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart row shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <div className="skeleton h-4 w-36" />
              <div className="skeleton h-2.5 w-52" />
            </div>
            <div className="skeleton h-7 w-24 rounded-lg" />
          </div>
          <div className="skeleton h-52 w-full rounded-xl" />
        </div>
        <div className="card space-y-4">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-2.5 w-40" />
          <div className="skeleton skeleton-circle w-40 h-40 mx-auto" />
          <div className="space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div className="skeleton h-2.5 w-24" />
                <div className="skeleton h-2.5 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card space-y-4">
          <div className="skeleton h-4 w-36" />
          <div className="skeleton skeleton-circle w-28 h-28 mx-auto" />
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 card space-y-3">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-2.5 w-48" />
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 py-1">
              <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-48" />
                <div className="skeleton h-2.5 w-32" />
              </div>
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Custom Chart Tooltip ──
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <p className="font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-bold" style={{ color: entry.color }}>
          {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

// ── Circular Progress Ring ──
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#10b981' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 400);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border-card)" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{percentage}%</span>
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Rate</span>
      </div>
    </div>
  );
};

// ── Stat Card ──
const StatCard = ({ title, value, subtitle, icon: Icon, gradient, trend, trendValue, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="stat-card"
    style={{ '--stat-accent': gradient?.split(',')[0]?.replace('linear-gradient(135deg, ', '').trim() || '#6366f1' }}
  >
    <div className="flex items-start justify-between relative z-10">
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] mb-2" style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          <AnimatedNumber value={value} />
        </p>
        {subtitle && (
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{
          background: gradient,
          boxShadow: `0 4px 16px ${gradient?.includes('99') ? 'rgba(99,102,241,0.3)' : 'rgba(0,0,0,0.2)'}`,
        }}
      >
        <Icon size={19} strokeWidth={2} className="text-white" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-3 text-[11px] font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0
          ? <ArrowUpRight size={13} strokeWidth={2.5} />
          : <ArrowDownRight size={13} strokeWidth={2.5} />
        }
        {Math.abs(trendValue || trend)}% vs last month
      </div>
    )}
    {/* Decorative glow blob */}
    <div
      className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-[0.09] pointer-events-none"
      style={{ background: gradient }}
    />
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6m');

  useEffect(() => {
    let active = true;
    let timeoutId;
    let intervalId;

    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        if (!active) return;
        setStats(res.data.data);
        setLoading(false);
        if (!intervalId) {
          intervalId = setInterval(fetchStats, 5000);
        }
      } catch (e) {
        if (!active) return;
        timeoutId = setTimeout(fetchStats, 5000);
      }
    };

    fetchStats();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const getMockStats = () => ({
    employees: { total: 24, active: 22 },
    customers: { total: 48, active: 40 },
    projects: { total: 12, in_progress: 7, completed: 3, overdue: 2 },
    tickets: { total: 31, open: 8, critical: 2 },
    revenue: { total_revenue: 1850000, paid: 1420000, pending: 430000 },
    payroll: { total_payroll: 540000 },
    attendance: { today_present: 18, today_late: 3 },
    monthlyRevenue: [
      { month: 'Dec', revenue: 180000 },
      { month: 'Jan', revenue: 220000 },
      { month: 'Feb', revenue: 195000 },
      { month: 'Mar', revenue: 310000 },
      { month: 'Apr', revenue: 275000 },
      { month: 'May', revenue: 420000 },
    ],
    recentActivity: [
      { type: 'ticket',  reference: 'TKT-00031', description: 'Server downtime issue',    status: 'Open',        created_at: new Date() },
      { type: 'project', reference: 'PROJ-001',  description: 'CRM Development',          status: 'In Progress', created_at: new Date() },
      { type: 'invoice', reference: 'INV-00024', description: 'Invoice for TechCorp',     status: 'Paid',        created_at: new Date() },
      { type: 'ticket',  reference: 'TKT-00030', description: 'Email not working',        status: 'Resolved',    created_at: new Date() },
    ],
  });

  if (loading) return <DashboardSkeleton />;

  const s = stats || getMockStats();
  const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;
  const attendanceRate = Math.round(((s.attendance?.today_present || 18) / (s.employees?.active || 22)) * 100);

  const projectPieData = [
    { name: 'In Progress', value: parseInt(s.projects?.in_progress || 7),  color: '#6366f1' },
    { name: 'Completed',   value: parseInt(s.projects?.completed   || 3),  color: '#10b981' },
    { name: 'Overdue',     value: parseInt(s.projects?.overdue     || 2),  color: '#ef4444' },
    {
      name: 'Not Started',
      value: Math.max(0, parseInt(s.projects?.total || 12) - parseInt(s.projects?.in_progress || 7) - parseInt(s.projects?.completed || 3) - parseInt(s.projects?.overdue || 2)),
      color: '#475569',
    },
  ];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const statusIcon = (type) => {
    switch (type) {
      case 'ticket':  return { icon: Ticket,      color: '#f87171', bg: 'rgba(239,68,68,0.1)' };
      case 'project': return { icon: FolderKanban, color: '#818cf8', bg: 'rgba(99,102,241,0.1)' };
      default:        return { icon: FileText,     color: '#34d399', bg: 'rgba(16,185,129,0.1)' };
    }
  };

  return (
    <div className="space-y-5">

      {/* ══════ WELCOME BANNER ══════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl p-6 noise-overlay"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(236,72,153,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.12)',
        }}
      >
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar size={13} strokeWidth={2} className="text-indigo-400" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              Here's what's happening across your organization today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold"
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.22)',
                color: '#34d399',
              }}
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </div>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none"
             style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-12 pointer-events-none"
             style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }} />
      </motion.div>

      {/* ══════ STAT CARDS ══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Employees" value={s.employees?.active || 22}
          subtitle={`${s.employees?.total || 24} total registered`}
          icon={Users} gradient="linear-gradient(135deg, #6366f1, #4f46e5)" trend={8} delay={1} />
        <StatCard title="Active Customers" value={s.customers?.active || 40}
          subtitle={`${s.customers?.total || 48} total customers`}
          icon={UserCheck} gradient="linear-gradient(135deg, #10b981, #059669)" trend={12} delay={2} />
        <StatCard title="Active Projects" value={s.projects?.in_progress || 7}
          subtitle={`${s.projects?.overdue || 2} overdue`}
          icon={FolderKanban} gradient="linear-gradient(135deg, #f59e0b, #d97706)" trend={-3} delay={3} />
        <StatCard title="Open Tickets" value={s.tickets?.open || 8}
          subtitle={`${s.tickets?.critical || 2} critical priority`}
          icon={Ticket} gradient="linear-gradient(135deg, #ef4444, #dc2626)" trend={-15} delay={4} />
      </div>

      {/* ══════ REVENUE MINI CARDS ══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue (YTD)', value: fmt(s.revenue?.total_revenue), icon: IndianRupee, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#818cf8' },
          { label: 'Collected', value: fmt(s.revenue?.paid), icon: CheckCircle2, gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#34d399' },
          { label: 'Pending', value: fmt(s.revenue?.pending), icon: AlertCircle, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fbbf24' },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 + idx * 0.07, duration: 0.38, ease: [0.16,1,0.3,1] }}
            className="card-glass flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: item.gradient }}>
              <item.icon size={18} strokeWidth={2} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                {item.label}
              </p>
              <p className="text-xl font-extrabold tracking-tight mt-0.5" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ══════ CHARTS ROW ══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Revenue Overview</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Monthly revenue for the last 6 months</p>
            </div>
            <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
              {['3m', '6m', '1y'].map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className="px-2.5 py-1 text-[10.5px] rounded-md font-bold transition-all duration-200"
                  style={{
                    background: dateRange === r ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                    color: dateRange === r ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={s.monthlyRevenue || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip formatter={(v) => `₹${parseFloat(v).toLocaleString('en-IN')}`} />} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }}
                activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Project Status Donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="card"
        >
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Project Status</h3>
          <p className="text-[11px] mt-0.5 mb-4" style={{ color: 'var(--text-muted)' }}>Distribution by current status</p>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={projectPieData} cx="50%" cy="50%"
                  innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {projectPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                  borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', fontSize: 12,
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-1">
            {projectPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══════ BOTTOM ROW ══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Attendance Ring */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Today's Attendance</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Clock size={15} strokeWidth={2} className="text-indigo-400" />
          </div>
          <div className="flex justify-center mb-4">
            <CircularProgress percentage={attendanceRate} color="#6366f1" size={110} strokeWidth={8} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Present', value: s.attendance?.today_present || 18, color: 'var(--status-present)' },
              { label: 'Late',    value: s.attendance?.today_late    || 3,  color: 'var(--status-late)' },
              { label: 'Absent',  value: Math.max(0, (s.employees?.active || 22) - (s.attendance?.today_present || 18) - (s.attendance?.today_late || 3)), color: 'var(--status-absent)' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-2.5 text-center"
                   style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-card)' }}>
                <p className="text-xl font-extrabold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.4, ease: [0.16,1,0.3,1] }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest system events and updates</p>
            </div>
            <Activity size={15} strokeWidth={2} style={{ color: '#a78bfa' }} />
          </div>

          <div className="space-y-0.5">
            {(s.recentActivity || []).map((item, idx) => {
              const si = statusIcon(item.type);
              const ItemIcon = si.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group cursor-default"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="relative flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: si.bg }}>
                      <ItemIcon size={14} strokeWidth={2} style={{ color: si.color }} />
                    </div>
                    {idx < (s.recentActivity?.length || 0) - 1 && (
                      <div className="w-px h-3 mt-0.5" style={{ background: 'var(--border-card)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.description || item.reference}
                      </p>
                      <span className={`shrink-0 ${
                        item.status === 'Open' ? 'badge-red' :
                        item.status === 'In Progress' ? 'badge-yellow' :
                        ['Paid','Completed','Resolved'].includes(item.status) ? 'badge-green' : 'badge-gray'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {item.reference} · Just now
                    </p>
                  </div>
                  <ChevronRight
                    size={13} strokeWidth={2}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ══════ QUICK ACTIONS ══════ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.58, duration: 0.38, ease: [0.16,1,0.3,1] }}
        className="card-glass"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
          <Zap size={14} strokeWidth={2} className="text-amber-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'New Employee',   icon: Users,     gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', path: '/employees' },
            { label: 'Create Invoice', icon: FileText,  gradient: 'linear-gradient(135deg, #10b981, #059669)', path: '/invoices' },
            { label: 'View Reports',   icon: Eye,       gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', path: '/reports' },
            { label: 'Add Customer',   icon: UserCheck, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', path: '/customers' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => window.location.href = action.path}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group"
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-card)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-card-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-card)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: action.gradient }}>
                <action.icon size={16} strokeWidth={2} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Click to open</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
