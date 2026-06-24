import { useState, useEffect } from 'react';
import { Plus, FileText, Send, ArrowRight, Receipt } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function QuotationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="skeleton h-7 w-52 rounded-xl" />
          <div className="skeleton h-3 w-40 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-36 rounded-xl" />
      </div>
      <div className="card p-0">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
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

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer_id: '', subject: '', tax_percent: 18, discount: 0, notes: '', terms: 'Payment due within 30 days', items: [{ description: '', quantity: 1, unit_price: 0 }] });

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [qRes, cRes] = await Promise.all([
        api.get('/billing/quotations?limit=50'),
        api.get('/customers?limit=100'),
      ]);
      setQuotations(qRes.data.data || []);
      setCustomers(cRes.data.data || []);
    } catch (e) {
      setQuotations([
        { id: '1', quotation_number: 'QUO-00001', customer_name: 'TechVentures Pvt Ltd', date: '2024-05-01', expiry_date: '2024-05-31', subtotal: 250000, tax_percent: 18, tax_amount: 45000, total: 295000, status: 'Sent' },
        { id: '2', quotation_number: 'QUO-00002', customer_name: 'Global Innovations', date: '2024-05-10', expiry_date: '2024-06-10', subtotal: 180000, tax_percent: 18, tax_amount: 32400, total: 212400, status: 'Draft' },
      ]);
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0 }] });
  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
  const tax = (subtotal - parseFloat(form.discount || 0)) * (parseFloat(form.tax_percent || 0) / 100);
  const total = subtotal - parseFloat(form.discount || 0) + tax;

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing/quotations', { ...form });
      toast.success('Quotation created');
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const generatePdf = async (id) => {
    try {
      const res = await api.post(`/billing/quotations/${id}/generate-pdf`);
      toast.success('PDF generated');
      window.open(`http://localhost:5000${res.data.data.pdfUrl}`, '_blank');
    } catch (e) { toast.error('Failed to generate PDF'); }
  };

  const sendQuotation = async (id, name) => {
    try {
      await api.post(`/billing/quotations/${id}/send`);
      toast.success(`Quotation sent to ${name}`);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to send'); }
  };

  const convertToInvoice = async (id) => {
    try {
      await api.post(`/billing/quotations/${id}/convert`, { due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
      toast.success('Converted to invoice!');
      fetchData();
    } catch (e) { toast.error('Failed to convert'); }
  };

  const statusBadge = { Draft: 'badge-gray', Sent: 'badge-blue', Accepted: 'badge-green', Declined: 'badge-red', Expired: 'badge-yellow' };
  const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;

  if (loading) return <QuotationsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotation Management</h1>
          <p className="page-subtitle">Create and send professional quotations · {quotations.length} total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Quotation
        </button>
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Expiry</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-[var(--text-secondary)] text-sm">No quotations found. Create one to get started.</td></tr>
              ) : quotations.map((q) => (
                <tr key={q.id}>
                  <td className="text-blue-400 font-mono text-sm font-semibold">{q.quotation_number}</td>
                  <td className="text-[var(--text-primary)] font-medium">{q.customer_name}</td>
                  <td className="text-[var(--text-secondary)] text-sm">{q.date ? new Date(q.date).toLocaleDateString('en-IN') : '-'}</td>
                  <td className="text-[var(--text-secondary)] text-sm">{q.expiry_date ? new Date(q.expiry_date).toLocaleDateString('en-IN') : '-'}</td>
                  <td>
                    <div>
                      <p className="text-emerald-400 font-bold">{fmt(q.total)}</p>
                      <p className="text-[var(--text-secondary)] text-xs">Subtotal: {fmt(q.subtotal)} + GST {q.tax_percent}%</p>
                    </div>
                  </td>
                  <td><span className={statusBadge[q.status] || 'badge-gray'}>{q.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => generatePdf(q.id)} className="btn-secondary btn-sm" title="Generate PDF"><FileText className="w-3 h-3" /></button>
                      <button onClick={() => sendQuotation(q.id, q.customer_name)} className="btn-secondary btn-sm" title="Email"><Send className="w-3 h-3" /></button>
                      {q.status === 'Sent' && (
                        <button onClick={() => convertToInvoice(q.id)} className="btn-primary btn-sm" title="Convert to Invoice">
                          <ArrowRight className="w-3 h-3" /> Invoice
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

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-3xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Create Quotation</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-2">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Customer *</label>
                  <select className="select" required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                    <option value="">Select Customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Quotation for web development..." />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Line Items</label>
                  <button type="button" onClick={addItem} className="btn-ghost text-xs gap-1">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input className="input col-span-6" placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} required />
                      <input className="input col-span-2" type="number" placeholder="Qty" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                      <input className="input col-span-3" type="number" placeholder="Unit Price" min="0" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
                      <button type="button" onClick={() => removeItem(idx)} className="btn-ghost p-2 text-red-400 col-span-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="input-group">
                  <label className="input-label">Discount (₹)</label>
                  <input className="input" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} min="0" />
                </div>
                <div className="input-group">
                  <label className="input-label">GST %</label>
                  <input className="input" type="number" value={form.tax_percent} onChange={(e) => setForm({ ...form, tax_percent: e.target.value })} min="0" max="100" />
                </div>
                <div className="bg-[var(--bg-input)] border border-[var(--border-input)] rounded-xl p-3">
                  <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Total</p>
                  <p className="text-emerald-400 text-xl font-extrabold mt-0.5">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
