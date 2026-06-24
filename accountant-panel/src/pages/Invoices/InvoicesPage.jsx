import { useState, useEffect } from 'react';
import { Plus, FileText, Send, CheckCircle, TrendingUp, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="skeleton w-11 h-11 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-20 rounded-lg" />
              <div className="skeleton h-5 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="card p-0">
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-4 w-28 rounded-lg" />
              <div className="skeleton h-4 flex-1 rounded-lg" />
              <div className="skeleton h-4 w-20 rounded-lg" />
              <div className="skeleton h-6 w-16 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices,     setInvoices]     = useState([]);
  const [loading,      setLoading]      = useState(true);
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

  const generatePdf = async (id) => {
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

  const statusBadge = {
    Unpaid: 'badge-red', Paid: 'badge-green',
    Overdue: 'badge-red', 'Partially Paid': 'badge-yellow', Cancelled: 'badge-gray',
  };
  const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.total || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + parseFloat(i.balance_due || 0), 0);

  if (loading) return <InvoicesSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Management</h1>
          <p className="page-subtitle">Track billing, payments and outstanding balances</p>
        </div>
        <div className="flex gap-2">
          <select className="select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Unpaid', 'Paid', 'Overdue', 'Partially Paid'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Total Collected</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{fmt(totalRevenue)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Pending Amount</p>
            <p className="text-xl font-extrabold text-red-400 mt-0.5">{fmt(totalPending)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Total Invoices</p>
            <p className="text-xl font-extrabold text-blue-400 mt-0.5">{invoices.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
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
              {invoices.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-[var(--text-secondary)] text-sm">No invoices found.</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="text-blue-400 font-mono text-sm font-semibold">{inv.invoice_number}</td>
                  <td className="text-[var(--text-primary)] font-medium">{inv.customer_name}</td>
                  <td className="text-[var(--text-secondary)] text-sm">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '-'}</td>
                  <td className={`text-sm ${inv.status === 'Overdue' ? 'text-red-400 font-medium' : 'text-[var(--text-secondary)]'}`}>
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '-'}
                  </td>
                  <td className="text-[var(--text-primary)] font-medium">{fmt(inv.total)}</td>
                  <td className={inv.balance_due > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                    {inv.balance_due > 0 ? fmt(inv.balance_due) : 'Cleared ✓'}
                  </td>
                  <td><span className={statusBadge[inv.status] || 'badge-gray'}>{inv.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => generatePdf(inv.id, inv.invoice_number)} className="btn-secondary btn-sm" title="Generate PDF">
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
