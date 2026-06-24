import { useState, useEffect } from 'react';
import { FileText, Download, IndianRupee, CheckCircle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

/* ── Skeletons ──────────────────────────────────────────── */
function SummaryCardSkeleton() {
  return (
    <div className="stat-card border border-[var(--border-card)]">
      <div className="skeleton stat-icon w-12 h-12 rounded-xl" />
      <div className="space-y-2 flex-1">
        <div className="skeleton-text w-24" />
        <div className="skeleton w-28 h-6 rounded-lg" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton-text w-20" />
        </td>
      ))}
    </tr>
  );
}

/* ────────────────────────────────────────────────────────── */
export default function PayslipsPage() {
  const [payrolls,    setPayrolls]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [downloading, setDownloading] = useState({});

  const fetchPayslips = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/payroll?limit=50');
      setPayrolls(res.data.data || []);
    } catch { setPayrolls([]); if (!silent) toast.error('Failed to load monthly payslips.'); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    fetchPayslips();
    const interval = setInterval(() => {
      fetchPayslips(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const downloadSlip = async (id, monthName, year) => {
    setDownloading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.post(`/payroll/${id}/generate-slip`);
      toast.success('Salary slip compiled! 📄');
      window.open(`http://localhost:5000${res.data.data.pdfUrl}`, '_blank');
    } catch {
      toast.error('Failed to compile payslip.');
    } finally {
      setDownloading((prev) => ({ ...prev, [id]: false }));
    }
  };

  /* Summary stats from latest payroll */
  const latest = payrolls[0];
  const totalNet   = payrolls.reduce((s, p) => s + parseFloat(p.net_salary   || 0), 0);
  const totalGross = payrolls.reduce((s, p) => s + parseFloat(p.gross_salary  || 0), 0);
  const totalDeductions = payrolls.reduce((s, p) => s + parseFloat((p.pf_deduction || 0) + (p.tax_deduction || 0)), 0);

  const SUMMARY = [
    { label: 'Latest Net Pay',    value: latest ? fmt(latest.net_salary)   : '—', icon: Wallet,       colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/10' },
    { label: 'YTD Gross Earnings',value: fmt(totalGross),                          icon: TrendingUp,    colorClass: 'text-blue-400',    bgClass: 'bg-blue-500/10',    borderClass: 'border-blue-500/10'    },
    { label: 'YTD Deductions',    value: fmt(totalDeductions),                     icon: TrendingDown,  colorClass: 'text-red-400',     bgClass: 'bg-red-500/10',     borderClass: 'border-red-500/10'     },
    { label: 'YTD Net Salary',    value: fmt(totalNet),                            icon: IndianRupee,   colorClass: 'text-violet-400',  bgClass: 'bg-violet-500/10',  borderClass: 'border-violet-500/10'  },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary Slips</h1>
          <p className="page-subtitle">View and download your monthly payslips securely</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
          : SUMMARY.map((s) => (
            <div key={s.label} className={`stat-card border ${s.borderClass}`}>
              <div className={`stat-icon ${s.bgClass}`}>
                <s.icon className={`w-5 h-5 ${s.colorClass}`} />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-xs font-medium">{s.label}</p>
                <p className={`text-base font-bold mt-0.5 ${s.colorClass}`}>{s.value}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-card)] flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          <h3 className="text-[var(--text-primary)] font-semibold text-sm">Payslip History</h3>
        </div>
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Billing Cycle</th>
                <th>Basic Salary</th>
                <th>Gross Earnings</th>
                <th>Deductions</th>
                <th>Net Payout</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)
                : payrolls.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-[var(--text-secondary)] text-sm">No salary slips found yet</p>
                      </td>
                    </tr>
                  )
                  : payrolls.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="text-[var(--text-primary)] font-semibold">{MONTHS[p.month]} {p.year}</span>
                      </td>
                      <td className="text-[var(--text-secondary)]">{fmt(p.basic_salary)}</td>
                      <td className="text-blue-400 font-medium">{fmt(p.gross_salary)}</td>
                      <td className="text-red-400">
                        -{fmt((p.pf_deduction || 0) + (p.tax_deduction || 0))}
                      </td>
                      <td className="text-emerald-400 font-bold">{fmt(p.net_salary)}</td>
                      <td className="text-[var(--text-secondary)] text-sm">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <span className="badge-green gap-1">
                          <CheckCircle className="w-3 h-3" /> {p.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => downloadSlip(p.id, MONTHS[p.month], p.year)}
                          disabled={downloading[p.id]}
                          className="btn-secondary btn-sm gap-1.5"
                        >
                          {downloading[p.id]
                            ? <div className="w-3.5 h-3.5 border-2 border-[var(--text-secondary)]/30 border-t-[var(--text-secondary)] rounded-full animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                          }
                          {downloading[p.id] ? 'Generating...' : 'PDF Slip'}
                        </button>
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
