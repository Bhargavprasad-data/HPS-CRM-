import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './redux/store';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, AlertCircle, CheckCircle, IndianRupee,
  ArrowUpRight, ArrowDownRight, Receipt, FileText,
  Users
} from 'lucide-react';
import AccountantLayout from './layouts/AccountantLayout';
import { useState, useEffect } from 'react';
import api from './services/api';
import LoginPage from './pages/Login/LoginPage';
import SignupPage from './pages/Login/SignupPage';
import PayrollPage from './pages/Payroll/PayrollPage';
import QuotationsPage from './pages/Quotations/QuotationsPage';
import InvoicesPage from './pages/Invoices/InvoicesPage';
import ReportsPage from './pages/Reports/ReportsPage';
import ProfilePage from './pages/Profile/ProfilePage';

/* ═══════════════════════════════════════════════════════════════
   SKELETON  (Dashboard loading)
═══════════════════════════════════════════════════════════════ */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-52 rounded-xl" />
      <div className="skeleton h-4 w-72 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton w-11 h-11 rounded-xl" />
            <div className="skeleton h-6 w-28 rounded-xl" />
            <div className="skeleton h-3 w-20 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="card space-y-4">
        <div className="skeleton h-5 w-48 rounded-xl" />
        <div className="skeleton h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════ */
function StatCard({ label, value, sub, icon: Icon, gradient, trend, trendUp }) {
  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-lg ${
            trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-[var(--text-primary)] leading-none tracking-tight">{value}</p>
      <p className="text-[var(--text-secondary)] text-sm mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)] mt-0.5 opacity-70">{sub}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
function AccountantDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const monthlyData = [
    { month: 'Jan', revenue: 220000, expenses: 145000 },
    { month: 'Feb', revenue: 195000, expenses: 130000 },
    { month: 'Mar', revenue: 310000, expenses: 200000 },
    { month: 'Apr', revenue: 275000, expenses: 185000 },
    { month: 'May', revenue: 420000, expenses: 240000 },
    { month: 'Jun', revenue: 380000, expenses: 210000 },
  ];

  const pieData = [
    { name: 'Paid',    value: 62, color: '#10b981' },
    { name: 'Pending', value: 28, color: '#f59e0b' },
    { name: 'Overdue', value: 10, color: '#ef4444' },
  ];

  useEffect(() => {
    let active = true;
    let timeoutId;
    let intervalId;

    const fetchStats = () => {
      api.get('/reports/dashboard')
        .then((r) => {
          if (!active) return;
          setStats(r.data.data);
          setLoading(false);
          if (!intervalId) {
            intervalId = setInterval(fetchStats, 60000);
          }
        })
        .catch(() => {
          if (!active) return;
          timeoutId = setTimeout(fetchStats, 5000);
        });
    };

    fetchStats();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;

  if (loading) return <DashboardSkeleton />;

  const recentInvoices = [
    { num: 'INV-00024', customer: 'TechVentures Pvt Ltd',   amount: 295000, status: 'Paid' },
    { num: 'INV-00023', customer: 'Global Innovations Inc', amount: 212400, status: 'Unpaid' },
    { num: 'INV-00022', customer: 'Sunrise Retail Pvt Ltd', amount: 141600, status: 'Overdue' },
    { num: 'INV-00021', customer: 'Blue Horizon Systems',   amount: 98500,  status: 'Paid' },
  ];

  const payrollBreakdown = [
    { dept: 'Development',    amount: 180000, pct: 36 },
    { dept: 'Operations',     amount: 130000, pct: 26 },
    { dept: 'Finance',        amount: 110000, pct: 22 },
    { dept: 'Administration', amount: 80000,  pct: 16 },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Dashboard</h1>
          <p className="page-subtitle">Real-time overview · Revenue · Payroll · Billing</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl text-xs text-[var(--text-secondary)]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 dot-pulse" />
          Live · Updated just now
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="YTD Revenue"
          value={fmt(stats?.revenue?.total_revenue || 1850000)}
          sub="Financial year 2024-25"
          icon={TrendingUp}
          gradient="from-amber-500 to-orange-600"
          trend="+12.4%"
          trendUp
        />
        <StatCard
          label="Collected"
          value={fmt(stats?.revenue?.paid || 1420000)}
          sub="All cleared invoices"
          icon={CheckCircle}
          gradient="from-emerald-500 to-teal-600"
          trend="+8.1%"
          trendUp
        />
        <StatCard
          label="Outstanding"
          value={fmt(stats?.revenue?.pending || 430000)}
          sub="Pending + overdue"
          icon={AlertCircle}
          gradient="from-red-500 to-rose-600"
          trend="-3.2%"
          trendUp={false}
        />
        <StatCard
          label="Monthly Payroll"
          value={fmt(stats?.payroll?.total_payroll || 540000)}
          sub={`${stats?.payroll?.employee_count || 24} employees`}
          icon={IndianRupee}
          gradient="from-blue-500 to-indigo-600"
          trend="+2.0%"
          trendUp
        />
      </div>

      {/* ── Area Chart ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[var(--text-primary)] font-bold text-base">Revenue vs Expenses</h3>
            <p className="text-[var(--text-secondary)] text-xs mt-0.5">Last 6 months trend</p>
          </div>
          <div className="flex gap-4">
            {[{ color: '#f59e0b', label: 'Revenue' }, { color: '#ef4444', label: 'Expenses' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                <span className="text-[var(--text-secondary)] text-xs">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card-glass)', borderRadius: '12px', color: 'var(--text-primary)' }}
              formatter={(v, n) => [`₹${v.toLocaleString('en-IN')}`, n === 'revenue' ? 'Revenue' : 'Expenses']}
            />
            <Area type="monotone" dataKey="revenue"  stroke="#f59e0b" strokeWidth={2.5} fill="url(#revGrad)" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#expGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Invoices */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[var(--text-primary)] font-bold text-base">Recent Invoices</h3>
              <p className="text-[var(--text-secondary)] text-xs mt-0.5">Latest billing activity</p>
            </div>
            <span className="badge-amber flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {recentInvoices.length} records
            </span>
          </div>
          <div className="space-y-2">
            {recentInvoices.map((inv) => (
              <div key={inv.num} className="flex items-center justify-between p-3.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] rounded-xl border border-[var(--border-input)] transition-all duration-150 cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-blue-400 text-xs font-mono font-semibold">{inv.num}</p>
                    <p className="text-[var(--text-primary)] text-sm">{inv.customer}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-emerald-400 font-bold text-sm">₹{inv.amount.toLocaleString('en-IN')}</p>
                  <span className={
                    inv.status === 'Paid'    ? 'badge-green' :
                    inv.status === 'Overdue' ? 'badge-red'   : 'badge-yellow'
                  }>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payroll Breakdown */}
        <div className="card">
          <div className="mb-5">
            <h3 className="text-[var(--text-primary)] font-bold text-base">Payroll Breakdown</h3>
            <p className="text-[var(--text-secondary)] text-xs mt-0.5">By department this month</p>
          </div>

          {/* Mini pie */}
          <div className="flex justify-center mb-4">
            <PieChart width={130} height={130}>
              <Pie data={pieData} cx={60} cy={60} innerRadius={38} outerRadius={58}
                dataKey="value" paddingAngle={3} strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="flex justify-center gap-3 mb-4">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="text-[var(--text-secondary)] text-[10px]">{p.name}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {payrollBreakdown.map((p) => (
              <div key={p.dept}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-primary)] font-medium">{p.dept}</span>
                  <span className="text-amber-400 font-semibold">₹{p.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-[var(--bg-input)] rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${p.pct}%`, transition: 'width 0.8s ease' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Info Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Receipt,  label: 'Total Invoices',   value: stats?.invoices?.total    || 47,  color: 'text-blue-400',   bg: 'bg-blue-500/10   border-blue-500/20' },
          { icon: FileText, label: 'Quotations Sent',  value: stats?.quotations?.total  || 23,  color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { icon: Users,    label: 'Active Employees', value: stats?.employees?.active  || 24,  color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((item) => (
          <div key={item.label} className={`card flex items-center gap-4 border ${item.bg}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-extrabold ${item.color}`}>{item.value}</p>
              <p className="text-[var(--text-secondary)] text-xs mt-0.5">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUTH GUARD
═══════════════════════════════════════════════════════════════ */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/* ═══════════════════════════════════════════════════════════════
   ROUTES
═══════════════════════════════════════════════════════════════ */
function AppRoutes() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return (
    <Routes>
      <Route path="/login"  element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route path="/"       element={<Navigate to="/dashboard" replace />} />
      <Route path="/*"      element={
        <ProtectedRoute>
          <AccountantLayout>
            <Routes>
              <Route path="/dashboard"  element={<AccountantDashboard />} />
              <Route path="/payroll"    element={<PayrollPage />} />
              <Route path="/quotations" element={<QuotationsPage />} />
              <Route path="/invoices"   element={<InvoicesPage />} />
              <Route path="/reports"    element={<ReportsPage />} />
              <Route path="/profile"    element={<ProfilePage />} />
              <Route path="*"           element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AccountantLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-card-glass)',
              borderRadius: '12px',
              fontSize: '13px',
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}
