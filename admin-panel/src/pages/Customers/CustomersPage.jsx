import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Building2, Phone, Mail, Edit, Trash2, UserCheck, X, RefreshCw, Briefcase } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Shimmer Skeleton ──
function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2"><div className="skeleton skeleton-title w-52" /><div className="skeleton skeleton-text w-32" /></div>
        <div className="skeleton skeleton-button w-36" />
      </div>
      <div className="card-glass flex gap-3"><div className="skeleton h-10 flex-1 rounded-xl" /></div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="card space-y-3" style={{ padding: '14px', minHeight: '160px' }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
                <div className="space-y-1.5"><div className="skeleton h-3 w-20" /><div className="skeleton h-2 w-12" /></div>
              </div>
              <div className="skeleton h-4 w-12 rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="skeleton h-2.5 w-full" />
              <div className="skeleton h-2.5 w-4/5" />
            </div>
            <div className="flex gap-2 pt-2" style={{borderTop:'1px solid var(--border-card)'}}>
              <div className="skeleton h-3 w-12 flex-1" />
              <div className="w-px" style={{background:'var(--border-card)'}} />
              <div className="skeleton h-3 w-12 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomerModal = ({ customer, onClose, onSaved }) => {
  const [form, setForm] = useState(customer || { name: '', email: '', phone: '', company: '', website: '', address: '', city: '', state: '', gst_number: '', notes: '', project_id: '' });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects?limit=100').then(res => setProjects(res.data.data || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (customer) {
        await api.put(`/customers/${customer.id}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer added');
      }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
              <UserPlus size={15} strokeWidth={2} className="text-white" />
            </div>
            <h2 className="text-lg font-bold" style={{color:'var(--text-primary)'}}>{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon"><X size={16} strokeWidth={2} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Full Name *', key: 'name', required: true, span: 'col-span-2 sm:col-span-1' },
            { label: 'Email', key: 'email', type: 'email', span: 'col-span-2 sm:col-span-1' },
            { label: 'Phone', key: 'phone', span: '' },
            { label: 'Company', key: 'company', span: '' },
            { label: 'Assign Project', key: 'project_id', type: 'select', span: '' },
            { label: 'GST Number', key: 'gst_number', span: '' },
            { label: 'City', key: 'city', span: '' },
            { label: 'State', key: 'state', span: '' },
          ].map((f) => (
            <div key={f.key} className={`input-group ${f.span}`}>
              <label className="input-label">{f.label}</label>
              {f.type === 'select' && f.key === 'project_id' ? (
                <select className="select w-full" value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  <option value="">-- Select Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ) : (
                <input className="input" type={f.type || 'text'} required={f.required} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          <div className="input-group col-span-2">
            <label className="input-label">Notes</label>
            <textarea className="input resize-none h-20" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border-card)'}}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {customer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [pagination, setPagination] = useState({ total: 0 });
  const [isOffline, setIsOffline] = useState(false);

  const fetchCustomers = useCallback(async (silent = false) => {
    if (!silent && customers.length === 0) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get(`/customers?search=${search}&limit=20`);
      setCustomers(res.data.data || []);
      setPagination(res.data.pagination || {});
      setLoading(false);
      setRefreshing(false);
      setIsOffline(false);
    } catch (e) {
      setIsOffline(true);
      setRefreshing(false);
      if (customers.length === 0) {
        setLoading(true);
      } else {
        setLoading(false);
      }
      setTimeout(() => {
        fetchCustomers(true);
      }, 3000);
    }
  }, [search, customers.length]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/customers?search=${search}&limit=20`)
        .then((res) => {
          setCustomers(res.data.data || []);
          setPagination(res.data.pagination || {});
          setIsOffline(false);
          setLoading(false);
        })
        .catch(() => {
          setIsOffline(true);
          if (customers.length === 0) {
            setLoading(true);
          }
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [search, customers.length]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try { await api.delete(`/customers/${id}`); toast.success('Customer deleted'); fetchCustomers(true); }
    catch (e) { toast.error('Failed to delete'); }
  };

  if (loading && customers.length === 0) return <CustomersSkeleton />;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3,ease:[0.16,1,0.3,1]}} className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck size={18} strokeWidth={2} className="text-indigo-400" />
            <h1 className="page-title">Customer Management</h1>
          </div>
          <p className="page-subtitle">{pagination.total || customers.length} customers in directory</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchCustomers(true)} className="btn-ghost btn-icon" disabled={refreshing}>
            <RefreshCw size={15} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setEditCustomer(null); setShowModal(true); }} className="btn-primary" disabled={isOffline}>
            <UserPlus size={15} strokeWidth={2} /> Add Customer
          </button>
        </div>
      </motion.div>

      {/* ── Reconnecting Banner ── */}
      {isOffline && (
        <div className="w-full flex items-center justify-between px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Connection lost. Showing offline cached data. Reconnecting in background...</span>
          </div>
          <span className="text-[10px] opacity-75">Retrying...</span>
        </div>
      )}

      {/* ── Search ── */}
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.3,ease:[0.16,1,0.3,1]}} className="card-glass flex gap-3 items-center">
        <Search size={14} strokeWidth={2} style={{color:'var(--text-muted)'}} className="shrink-0" />
        <input className="input" style={{flex:1}} placeholder="Search by name, company, email..." value={search} onChange={e=>setSearch(e.target.value)} />
      </motion.div>

      {/* ── Customer Cards ── */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {customers.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <UserCheck size={40} strokeWidth={1} className="mx-auto mb-3 opacity-20" style={{color:'var(--text-muted)'}} />
            <p className="text-sm font-medium" style={{color:'var(--text-muted)'}}>No customers found</p>
          </div>
        ) : customers.map((c, idx) => (
          <motion.div key={c.id}
            initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            transition={{delay:idx*0.05,duration:0.35,ease:[0.16,1,0.3,1]}}
            className={`card group flex flex-col justify-between relative overflow-hidden transition-all ${isOffline ? 'opacity-70 pointer-events-none' : ''}`}
            style={{cursor:'default', padding: '14px', minHeight: '160px'}}
            whileHover={{y:-3,boxShadow:'0 16px 48px var(--shadow-color)',borderColor:'var(--border-card-hover)'}}
          >
            {isOffline && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--shimmer-highlight)] to-transparent animate-[shimmer_1.7s_infinite_linear] pointer-events-none" style={{ backgroundSize: '200% 100%' }} />
            )}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs shrink-0"
                       style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs leading-tight truncate" style={{color:'var(--text-primary)'}} title={c.name}>{c.name}</h3>
                    <p className="text-[9px] font-mono mt-0.5" style={{color:'var(--text-muted)'}}>{c.customer_code}</p>
                  </div>
                </div>
                <span className={c.status==='Active'?'badge-green':c.status==='Prospect'?'badge-yellow':'badge-gray'} style={{ fontSize: '8.5px', padding: '1px 5px', borderRadius: '6px' }}>{c.status||'Active'}</span>
              </div>

              <div className="space-y-1 text-[10.5px]">
                {c.assigned_project && <div className="flex items-center gap-1.5" style={{color:'var(--text-secondary)'}}><Briefcase size={11} strokeWidth={2} className="shrink-0" /><span className="truncate font-medium">{c.assigned_project}</span></div>}
                {c.company && <div className="flex items-center gap-1.5" style={{color:'var(--text-secondary)'}}><Building2 size={11} strokeWidth={2} className="shrink-0" /><span className="truncate">{c.company}</span></div>}
                {c.email && <div className="flex items-center gap-1.5" style={{color:'var(--text-muted)'}}><Mail size={11} strokeWidth={2} className="shrink-0" /><span className="truncate">{c.email}</span></div>}
                {c.phone && <div className="flex items-center gap-1.5" style={{color:'var(--text-muted)'}}><Phone size={11} strokeWidth={2} className="shrink-0" /><span className="truncate">{c.phone}</span></div>}
                {c.city && <p className="text-[10px] mt-1 truncate" style={{color:'var(--text-muted)',opacity:0.75}}>{c.city}{c.state?`, ${c.state}`:''}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2" style={{borderTop:'1px solid var(--border-card)'}}>
              <div className="flex-1 text-center">
                <p className="text-sm font-bold" style={{color:'#818cf8'}}>{c.project_count||0}</p>
                <p className="text-[9px] font-semibold" style={{color:'var(--text-muted)'}}>Projects</p>
              </div>
              <div className="w-px h-5" style={{background:'var(--border-card)'}} />
              <div className="flex-1 text-center">
                <p className="text-sm font-bold" style={{color:'#34d399'}}>{c.invoice_count||0}</p>
                <p className="text-[9px] font-semibold" style={{color:'var(--text-muted)'}}>Invoices</p>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <button onClick={()=>{setEditCustomer(c);setShowModal(true);}} className="btn-ghost p-1 rounded-lg" style={{color:'#818cf8'}}>
                  <Edit size={11} strokeWidth={2} />
                </button>
                <button onClick={()=>handleDelete(c.id,c.name)} className="btn-ghost p-1 rounded-lg" style={{color:'#f87171'}}>
                  <Trash2 size={11} strokeWidth={2} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <CustomerModal
          customer={editCustomer}
          onClose={() => { setShowModal(false); setEditCustomer(null); }}
          onSaved={() => fetchCustomers(true)}
        />
      )}
    </div>
  );
}
