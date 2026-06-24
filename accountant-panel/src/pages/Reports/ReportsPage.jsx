import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, IndianRupee, FileSpreadsheet,
  Download, Calendar, CheckCircle, AlertCircle, Clock,
  ChevronDown, ChevronUp, ArrowUpRight, RefreshCw,
  FileText, Layers, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ── helpers ─────────────────────────────────────────────────── */
const fmt  = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;
const fmtN = (v) => parseFloat(v || 0).toLocaleString('en-IN');
const today = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

/* ── skeleton ────────────────────────────────────────────────── */
function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-52 rounded-xl" />
      <div className="skeleton h-4 w-80 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton w-11 h-11 rounded-xl" />
            <div className="skeleton h-6 w-28 rounded-xl" />
            <div className="skeleton h-3 w-20 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="card space-y-4">
        <div className="skeleton h-5 w-40 rounded-xl" />
        <div className="skeleton h-52 w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ── stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, gradient, trend }) {
  return (
    <div className="card group transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderColor: 'var(--border-card)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend != null && (
          <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ArrowUpRight className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-[var(--text-primary)] leading-none">{value}</p>
      <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium">{label}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)] mt-0.5 opacity-70">{sub}</p>}
    </div>
  );
}

/* ── tab button ──────────────────────────────────────────────── */
function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
        active
          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const STATUS_BADGE = {
  Paid: 'badge-green', Unpaid: 'badge-red',
  Overdue: 'badge-red', 'Partially Paid': 'badge-yellow',
  Cancelled: 'badge-gray',
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function ReportsPage() {
  const [tab,      setTab]      = useState('revenue');   // revenue | payroll
  const [loading,  setLoading]  = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  /* Revenue state */
  const [revRange, setRevRange] = useState({ start: firstOfMonth(), end: today() });
  const [revData,  setRevData]  = useState(null);   // { rows, stats }

  /* Payroll state */
  const currentMonth = new Date().getMonth() + 1;
  const currentYear  = new Date().getFullYear();
  const [payRange,  setPayRange]  = useState({ month: currentMonth, year: currentYear });
  const [payData,   setPayData]   = useState(null);
  const [paySearch, setPaySearch] = useState('');

  const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  /* ── fetch revenue ── */
  const fetchRevenue = async (silent = false) => {
    if (!revRange.start || !revRange.end) return;
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/reports/revenue?start_date=${revRange.start}&end_date=${revRange.end}`);
      setRevData({ rows: res.data.data || [], stats: res.data.stats || {} });
    } catch {
      if (!silent) toast.error('Failed to load revenue data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /* ── fetch payroll ── */
  const fetchPayroll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/reports/payroll?month=${payRange.month}&year=${payRange.year}`);
      setPayData(res.data.data || []);
    } catch {
      if (!silent) toast.error('Failed to load payroll data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /* ── auto-fetch on tab/filter change ── */
  useEffect(() => {
    if (tab === 'revenue') fetchRevenue();
    else fetchPayroll();

    const interval = setInterval(() => {
      if (tab === 'revenue') fetchRevenue(true);
      else fetchPayroll(true);
    }, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, revRange.start, revRange.end, payRange.month, payRange.year]);

  /* ── download handlers ── */
  const downloadPayrollExcel = async () => {
    setGenLoading(true);
    try {
      const res = await api.get(`/reports/payroll?month=${payRange.month}&year=${payRange.year}&format=excel`);
      if (res.data.data?.fileUrl) {
        toast.success(`Payroll report ready — ${res.data.data.rows || 0} records`);
        window.open(`http://localhost:5000${res.data.data.fileUrl}`, '_blank');
      }
    } catch {
      toast.error('Failed to generate payroll report');
    } finally {
      setGenLoading(false);
    }
  };

  /* ── revenue chart data ── */
  const buildRevChart = () => {
    if (!revData?.rows?.length) return [];
    const map = {};
    revData.rows.forEach((r) => {
      const month = r.date ? new Date(r.date).toLocaleString('default', { month: 'short' }) : '?';
      if (!map[month]) map[month] = { month, billed: 0, collected: 0, pending: 0 };
      map[month].billed    += parseFloat(r.total || 0);
      map[month].collected += parseFloat(r.paid_amount || 0);
      map[month].pending   += parseFloat(r.balance_due || 0);
    });
    return Object.values(map);
  };

  /* ── revenue pie ── */
  const buildRevPie = () => {
    if (!revData?.stats) return [];
    const s = revData.stats;
    return [
      { name: 'Collected', value: parseFloat(s.total_collected || 0) },
      { name: 'Pending',   value: parseFloat(s.total_pending   || 0) },
    ].filter(d => d.value > 0);
  };

  /* ── payroll dept chart ── */
  const buildDeptChart = () => {
    if (!payData?.length) return [];
    const map = {};
    payData.forEach((p) => {
      const dept = p.department || 'Other';
      if (!map[dept]) map[dept] = { dept, net: 0 };
      map[dept].net += parseFloat(p.net_salary || 0);
    });
    return Object.values(map).sort((a, b) => b.net - a.net);
  };

  const filteredPayroll = (payData || []).filter(p =>
    !paySearch || p.employee_name?.toLowerCase().includes(paySearch.toLowerCase())
    || p.department?.toLowerCase().includes(paySearch.toLowerCase())
  );

  const totalNet = (payData || []).reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
  const paidCount = (payData || []).filter(p => p.status === 'Paid').length;

  /* ── status breakdown for revenue ── */
  const statusBreakdown = () => {
    if (!revData?.rows?.length) return [];
    const map = {};
    revData.rows.forEach(r => {
      map[r.status] = (map[r.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  };

  if (loading && !revData && !payData) return <ReportsSkeleton />;

  const revChart  = buildRevChart();
  const revPie    = buildRevPie();
  const deptChart = buildDeptChart();

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">In-depth revenue and payroll analytics with export support</p>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-2xl w-fit">
        <TabBtn active={tab === 'revenue'} onClick={() => setTab('revenue')} icon={TrendingUp} label="Revenue Report" />
        <TabBtn active={tab === 'payroll'} onClick={() => setTab('payroll')} icon={IndianRupee} label="Payroll Report" />
      </div>

      {/* ══════════ REVENUE TAB ══════════ */}
      {tab === 'revenue' && (
        <div className="space-y-6">

          {/* Filter bar */}
          <div className="card">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="input-label">Start Date</label>
                <input type="date" className="input w-44"
                  value={revRange.start}
                  onChange={(e) => setRevRange({ ...revRange, start: e.target.value })} />
              </div>
              <div>
                <label className="input-label">End Date</label>
                <input type="date" className="input w-44"
                  value={revRange.end}
                  onChange={(e) => setRevRange({ ...revRange, end: e.target.value })} />
              </div>
              <button onClick={fetchRevenue} disabled={loading}
                className="btn-primary gap-2">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <RefreshCw className="w-4 h-4" />}
                {loading ? 'Loading…' : 'Apply Filter'}
              </button>
            </div>
          </div>

          {/* Revenue stat cards */}
          {revData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Billed"    value={fmt(revData.stats?.total_billed)}     icon={FileText}    gradient="from-blue-500 to-indigo-600" />
              <StatCard label="Total Collected" value={fmt(revData.stats?.total_collected)}  icon={CheckCircle} gradient="from-emerald-500 to-teal-600" />
              <StatCard label="Outstanding"     value={fmt(revData.stats?.total_pending)}    icon={AlertCircle} gradient="from-red-500 to-rose-600" />
            </div>
          )}

          {/* Charts row */}
          {revData && revData.rows.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Bar chart */}
              <div className="lg:col-span-2 card">
                <div className="mb-5">
                  <h3 className="text-[var(--text-primary)] font-bold text-sm">Monthly Revenue Breakdown</h3>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5">Billed vs Collected by month</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revChart} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card-glass)', borderRadius: 12, color: 'var(--text-primary)' }}
                      formatter={(v, n) => [`₹${v.toLocaleString('en-IN')}`, n === 'billed' ? 'Billed' : 'Collected']} />
                    <Bar dataKey="billed"    fill="#6366f1" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="collected" fill="#10b981" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {[{ c: '#6366f1', l: 'Billed' }, { c: '#10b981', l: 'Collected' }].map(i => (
                    <div key={i.l} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: i.c }} />
                      <span className="text-[var(--text-secondary)] text-xs">{i.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie chart */}
              <div className="card flex flex-col">
                <div className="mb-4">
                  <h3 className="text-[var(--text-primary)] font-bold text-sm">Collection Ratio</h3>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5">Collected vs outstanding</p>
                </div>
                {revPie.length > 0 ? (
                  <>
                    <div className="flex-1 flex items-center justify-center">
                      <PieChart width={170} height={170}>
                        <Pie data={revPie} cx={82} cy={82} innerRadius={50} outerRadius={75}
                          dataKey="value" paddingAngle={4} strokeWidth={0}>
                          {revPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                      </PieChart>
                    </div>
                    <div className="space-y-2 mt-2">
                      {revPie.map((p, i) => (
                        <div key={p.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                            <span className="text-[var(--text-secondary)]">{p.name}</span>
                          </div>
                          <span className="text-[var(--text-primary)] font-semibold">{fmt(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-sm">
                    No data
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice table */}
          {revData && (
            <div className="card p-0">
              <div className="flex items-center justify-between p-5 pb-0">
                <div>
                  <h3 className="text-[var(--text-primary)] font-bold text-sm">Invoice Details</h3>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5">{revData.rows.length} invoices in selected range</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Status breakdown badges */}
                  {statusBreakdown().map(s => (
                    <span key={s.name} className={STATUS_BADGE[s.name] || 'badge-gray'}>
                      {s.name}: {s.value}
                    </span>
                  ))}
                </div>
              </div>
              <div className="table-wrapper mt-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Collected</th>
                      <th>Pending</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revData.rows.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-[var(--text-secondary)] text-sm">No invoices in this date range.</td></tr>
                    ) : revData.rows.map((r) => (
                      <tr key={r.invoice_number}>
                        <td className="text-blue-400 font-mono text-xs font-semibold">{r.invoice_number}</td>
                        <td>
                          <p className="text-[var(--text-primary)] font-medium text-sm">{r.customer_name}</p>
                          {r.company && <p className="text-[var(--text-secondary)] text-xs">{r.company}</p>}
                        </td>
                        <td className="text-[var(--text-secondary)] text-sm">{r.date ? new Date(r.date).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="text-[var(--text-primary)] font-semibold text-sm">{fmt(r.total)}</td>
                        <td className="text-emerald-400 font-semibold text-sm">{fmt(r.paid_amount)}</td>
                        <td className={`font-semibold text-sm ${parseFloat(r.balance_due) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {parseFloat(r.balance_due) > 0 ? fmt(r.balance_due) : '—'}
                        </td>
                        <td><span className={STATUS_BADGE[r.status] || 'badge-gray'}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!revData && !loading && (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="w-10 h-10 text-amber-400/40 mb-3" />
              <p className="text-[var(--text-secondary)] text-sm">Select a date range and click Apply Filter to load revenue data.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════ PAYROLL TAB ══════════ */}
      {tab === 'payroll' && (
        <div className="space-y-6">

          {/* Filter bar */}
          <div className="card">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="input-label">Month</label>
                <select className="select w-40"
                  value={payRange.month}
                  onChange={(e) => setPayRange({ ...payRange, month: parseInt(e.target.value) })}>
                  {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Year</label>
                <input type="number" className="input w-28"
                  value={payRange.year} min="2020" max="2035"
                  onChange={(e) => setPayRange({ ...payRange, year: parseInt(e.target.value) })} />
              </div>
              <button onClick={fetchPayroll} disabled={loading}
                className="btn-primary gap-2">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <RefreshCw className="w-4 h-4" />}
                {loading ? 'Loading…' : 'Apply Filter'}
              </button>
              <button onClick={downloadPayrollExcel} disabled={genLoading}
                className="btn-secondary gap-2 ml-auto">
                {genLoading
                  ? <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  : <FileSpreadsheet className="w-4 h-4 text-amber-400" />}
                {genLoading ? 'Exporting…' : 'Export Excel'}
              </button>
            </div>
          </div>

          {/* Payroll stat cards */}
          {payData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Net Payroll"  value={fmt(totalNet)}         icon={IndianRupee}  gradient="from-amber-500 to-orange-600" />
              <StatCard label="Employees Processed" value={`${payData.length}`}  icon={Layers}       gradient="from-blue-500 to-indigo-600" />
              <StatCard label="Paid / Pending"      value={`${paidCount} / ${payData.length - paidCount}`} icon={CheckCircle} gradient="from-emerald-500 to-teal-600" />
            </div>
          )}

          {/* Department bar chart */}
          {payData && deptChart.length > 0 && (
            <div className="card">
              <div className="mb-5">
                <h3 className="text-[var(--text-primary)] font-bold text-sm">Department-wise Net Payroll</h3>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5">{MONTHS[payRange.month]} {payRange.year}</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptChart} barCategoryGap="35%" layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="dept" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card-glass)', borderRadius: 12, color: 'var(--text-primary)' }}
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Net Payroll']} />
                  <Bar dataKey="net" fill="#f59e0b" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Payroll detail table */}
          {payData && (
            <div className="card p-0">
              <div className="flex items-center justify-between p-5 pb-4">
                <div>
                  <h3 className="text-[var(--text-primary)] font-bold text-sm">Employee Payroll Details</h3>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5">{MONTHS[payRange.month]} {payRange.year} · {payData.length} employees</p>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <input
                    className="input pl-9 w-52 h-9 text-xs"
                    placeholder="Search employee / dept…"
                    value={paySearch}
                    onChange={(e) => setPaySearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Basic</th>
                      <th>Allowances</th>
                      <th>Deductions</th>
                      <th>Gross</th>
                      <th>Net Salary</th>
                      <th>Attendance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayroll.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 text-[var(--text-secondary)] text-sm">
                        {payData.length === 0 ? 'No payroll entries for this period.' : 'No results match your search.'}
                      </td></tr>
                    ) : filteredPayroll.map((p) => (
                      <tr key={p.employee_code || p.employee_name}>
                        <td>
                          <p className="text-[var(--text-primary)] font-medium text-sm">{p.employee_name}</p>
                          <p className="text-[var(--text-secondary)] text-xs">{p.employee_code} · {p.department}</p>
                        </td>
                        <td className="text-[var(--text-primary)] text-sm">{fmt(p.basic_salary)}</td>
                        <td className="text-blue-400 text-sm">{fmt((p.hra||0)+(p.transport_allowance||0)+(p.other_allowances||0))}</td>
                        <td className="text-red-400 text-sm">{fmt((p.pf_deduction||0)+(p.tax_deduction||0))}</td>
                        <td className="text-[var(--text-primary)] text-sm">{fmt(p.gross_salary)}</td>
                        <td className="text-emerald-400 font-bold text-sm">{fmt(p.net_salary)}</td>
                        <td className="text-[var(--text-secondary)] text-xs">{p.present_days}/{p.working_days}d</td>
                        <td><span className={p.status === 'Paid' ? 'badge-green' : 'badge-yellow'}>{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Total row */}
              {payData.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-card)] bg-[var(--bg-input)]">
                  <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">Total Net Payroll</span>
                  <span className="text-amber-400 font-extrabold text-base">{fmt(totalNet)}</span>
                </div>
              )}
            </div>
          )}

          {!payData && !loading && (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <IndianRupee className="w-10 h-10 text-amber-400/40 mb-3" />
              <p className="text-[var(--text-secondary)] text-sm">Click Apply Filter to load payroll data.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
