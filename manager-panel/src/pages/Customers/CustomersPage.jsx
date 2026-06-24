import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, Building2, Phone, Mail, Edit, X, UserCheck, Briefcase } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ── Customer Modal ───────────────────────────────────────── */
const CustomerModal = ({ customer, onClose, onSaved }) => {
  const [form, setForm] = useState(customer || {
    name: '', email: '', phone: '', company: '', website: '', address: '', city: '', state: '', gst_number: '', notes: '', project_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects?limit=100').then(res => setProjects(res.data.data || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (customer) { await api.put(`/customers/${customer.id}`, form); toast.success('Customer updated'); }
      else          { await api.post('/customers', form);                toast.success('Customer added');   }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/15 rounded-xl flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-teal-400" />
            </div>
            <h2 className="text-[var(--text-primary)] font-bold text-lg">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Full Name *', key: 'name',       required: true, span: 'col-span-2 sm:col-span-1' },
            { label: 'Email',       key: 'email',      type: 'email',  span: 'col-span-2 sm:col-span-1' },
            { label: 'Phone',       key: 'phone',       span: ''        },
            { label: 'Company',     key: 'company',     span: ''        },
            { label: 'Assign Project', key: 'project_id', type: 'select', span: ''        },
            { label: 'GST Number',  key: 'gst_number',  span: ''        },
            { label: 'City',        key: 'city',        span: ''        },
            { label: 'State',       key: 'state',       span: ''        },
          ].map((f) => (
            <div key={f.key} className={`input-group ${f.span}`}>
              <label className="input-label">{f.label}</label>
              {f.type === 'select' && f.key === 'project_id' ? (
                <select className="select w-full" value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  <option value="">-- Select Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ) : (
                <input
                  className="input"
                  type={f.type || 'text'}
                  required={f.required}
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="input-group col-span-2">
            <label className="input-label">Notes</label>
            <textarea className="input resize-none h-20" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="col-span-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{customer ? 'Update' : 'Add Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Skeleton ─────────────────────────────────────────────── */
function CustomerCardSkeleton() {
  return (
    <div className="card space-y-3" style={{ padding: '14px', minHeight: '160px' }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-2 w-12" />
          </div>
        </div>
        <div className="skeleton h-4 w-12 rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-2.5 w-full" />
        <div className="skeleton h-2.5 w-4/5" />
      </div>
      <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border-card)' }}>
        <div className="skeleton h-3 w-12 flex-1" />
        <div className="w-px" style={{ background: 'var(--border-card)' }} />
        <div className="skeleton h-3 w-12 flex-1" />
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function CustomersPage() {
  const [customers,     setCustomers]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [editCustomer,  setEditCustomer]  = useState(null);
  const [pagination,    setPagination]    = useState({ total: 0 });

  const fetchCustomers = useCallback(async (isRetry = false) => {
    if (!isRetry) setLoading(true);
    try {
      const res = await api.get(`/customers?search=${search}&limit=20`);
      setCustomers(res.data.data || []);
      setPagination(res.data.pagination || {});
      setLoading(false);
    } catch {
      setLoading(true);
      setTimeout(() => {
        fetchCustomers(true);
      }, 3000);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        api.get(`/customers?search=${search}&limit=20`)
          .then((res) => {
            setCustomers(res.data.data || []);
            setPagination(res.data.pagination || {});
          })
          .catch(() => {
            setLoading(true);
            fetchCustomers();
          });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [loading, fetchCustomers, search]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Accounts</h1>
          <p className="page-subtitle">{pagination.total || customers.length} customers total</p>
        </div>
        <button onClick={() => { setEditCustomer(null); setShowModal(true); }} className="btn-primary">
          <UserPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="card-glass flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input className="input pl-9" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {loading
          ? [1,2,3,4,5,6].map(i => <CustomerCardSkeleton key={i} />)
          : customers.length === 0
            ? (
              <div className="col-span-full card py-16 text-center">
                <UserCheck className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-2 opacity-40" />
                <p className="text-[var(--text-secondary)] text-sm">No customers found</p>
              </div>
            )
            : customers.map((c) => (
              <div key={c.id} className="card group flex flex-col justify-between" style={{ cursor: 'default', padding: '14px', minHeight: '160px' }}>
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs leading-tight truncate" style={{ color: 'var(--text-primary)' }} title={c.name}>{c.name}</h3>
                        <p className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.customer_code}</p>
                      </div>
                    </div>
                    <span className={c.status === 'Active' ? 'badge-green' : c.status === 'Prospect' ? 'badge-yellow' : 'badge-gray'} style={{ fontSize: '8.5px', padding: '1px 5px', borderRadius: '6px' }}>
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10.5px]">
                    {c.assigned_project && <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}><Briefcase size={11} strokeWidth={2} className="shrink-0" /><span className="truncate font-medium">{c.assigned_project}</span></div>}
                    {c.company && <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}><Building2 size={11} strokeWidth={2} className="shrink-0" /><span className="truncate">{c.company}</span></div>}
                    {c.email   && <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Mail size={11} strokeWidth={2} className="shrink-0" /><span className="truncate">{c.email}</span></div>}
                    {c.phone   && <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><Phone size={11} strokeWidth={2} className="shrink-0" /><span className="truncate">{c.phone}</span></div>}
                    {c.city    && <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--text-muted)', opacity: 0.75 }}>{c.city}, {c.state}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--border-card)]">
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-teal-400">{c.project_count || 0}</p>
                    <p className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Projects</p>
                  </div>
                  <div className="w-px h-5 bg-[var(--border-card)]" />
                  <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-emerald-400">{c.invoice_count || 0}</p>
                    <p className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Invoices</p>
                  </div>
                  <button
                    onClick={() => { setEditCustomer(c); setShowModal(true); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all ml-1 shrink-0"
                  >
                    <Edit size={11} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))
        }
      </div>

      {showModal && (
        <CustomerModal
          customer={editCustomer}
          onClose={() => { setShowModal(false); setEditCustomer(null); }}
          onSaved={fetchCustomers}
        />
      )}
    </div>
  );
}
