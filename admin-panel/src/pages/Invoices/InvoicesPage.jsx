import { useState, useEffect } from 'react';
import { Plus, FileText, Send, CheckCircle, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Shimmer Skeleton ──
function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-52" />
          <div className="skeleton skeleton-text w-32" />
        </div>
        <div className="skeleton skeleton-button w-36" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-glass flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-5 w-28" />
            </div>
          </div>
        ))}
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {['Invoice #', 'Customer', 'Invoice Date', 'Due Date', 'Amount', 'Balance Due', 'Status', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td><div className="skeleton h-5 w-24" /></td>
                  <td><div className="skeleton h-5 w-40" /></td>
                  <td><div className="skeleton h-4 w-20" /></td>
                  <td><div className="skeleton h-4 w-20" /></td>
                  <td><div className="skeleton h-4 w-24" /></td>
                  <td><div className="skeleton h-4 w-24" /></td>
                  <td><div className="skeleton h-6 w-16" /></td>
                  <td><div className="skeleton h-8 w-16" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/billing/invoices?status=${statusFilter}&limit=50`);
      setInvoices(res.data.data || []);
    } catch (e) {
      setInvoices([]);
      if (!silent) toast.error('Failed to load invoice records.');
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(() => {
      fetchInvoices(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const generatePdf = async (id, number) => {
    try {
      const res = await api.post(`/billing/invoices/${id}/generate-pdf`);
      toast.success('PDF generated');
      window.open(`http://localhost:5000${res.data.data.pdfUrl}`, '_blank');
    } catch (e) { toast.error('Failed to generate'); }
  };

  const markPaid = async (id) => {
    try {
      const inv = invoices.find((i) => i.id === id);
      await api.put(`/billing/invoices/${id}/mark-paid`, { paid_amount: inv.total, payment_method: 'Bank Transfer' });
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } catch (e) { toast.error('Failed'); }
  };

  const statusBadge = { Unpaid: 'badge-red', Paid: 'badge-green', Overdue: 'badge-red', 'Partially Paid': 'badge-yellow', Cancelled: 'badge-gray' };
  const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;

  if (loading) return <InvoicesSkeleton />;

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + parseFloat(i.balance_due || 0), 0);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Management</h1>
          <p className="page-subtitle">Track billing and payments</p>
        </div>
        <div className="flex gap-2">
          <select className="select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Unpaid', 'Paid', 'Overdue', 'Partially Paid'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass flex items-center gap-4">
          <div className="p-3 bg-emerald-500/15 rounded-2xl border border-emerald-500/30">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">Total Collected</p>
            <p className="text-xl font-bold text-emerald-400">{fmt(totalRevenue)}</p>
          </div>
        </div>
        <div className="card-glass flex items-center gap-4">
          <div className="p-3 bg-red-500/15 rounded-2xl border border-red-500/30">
            <FileText className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">Pending Amount</p>
            <p className="text-xl font-bold text-red-400">{fmt(totalPending)}</p>
          </div>
        </div>
        <div className="card-glass flex items-center gap-4">
          <div className="p-3 bg-blue-500/15 rounded-2xl border border-blue-500/30">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">Total Invoices</p>
            <p className="text-xl font-bold text-blue-400">{invoices.length}</p>
          </div>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="text-blue-400 font-mono text-sm font-medium">{inv.invoice_number}</td>
                  <td className="text-slate-200">{inv.customer_name}</td>
                  <td className="text-slate-400 text-sm">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '-'}</td>
                  <td className={`text-sm ${inv.status === 'Overdue' ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '-'}
                  </td>
                  <td className="text-slate-200 font-medium">{fmt(inv.total)}</td>
                  <td className={inv.balance_due > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-medium'}>
                    {inv.balance_due > 0 ? fmt(inv.balance_due) : 'Paid ✓'}
                  </td>
                  <td><span className={statusBadge[inv.status] || 'badge-gray'}>{inv.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => generatePdf(inv.id, inv.invoice_number)} className="btn-secondary btn-sm">
                        <FileText className="w-3 h-3" />
                      </button>
                      {inv.status !== 'Paid' && (
                        <button onClick={() => markPaid(inv.id)} className="btn-success btn-sm">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
