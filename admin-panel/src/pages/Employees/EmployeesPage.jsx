import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Download, Edit, Trash2, FileText,
  UserPlus, Users, UserCheck, UserX, Building2, X,
  Phone, Mail, Calendar, IndianRupee, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Administration', 'Development', 'Operations', 'Finance', 'Marketing', 'Sales', 'HR', 'Support'];

// ── Shimmer Skeleton ──
function EmployeesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-52" />
          <div className="skeleton skeleton-text w-36" />
        </div>
        <div className="skeleton skeleton-button w-36" />
      </div>
      <div className="card-glass flex flex-wrap gap-3">
        <div className="skeleton h-10 flex-1 min-w-48 rounded-xl" />
        <div className="skeleton h-10 w-44 rounded-xl" />
        <div className="skeleton h-10 w-28 rounded-xl" />
      </div>
      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {['Employee', 'Department', 'Designation', 'Phone', 'Salary', 'Joining Date', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6].map(i => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="skeleton h-3.5 w-28" />
                        <div className="skeleton h-2.5 w-40" />
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton h-5 w-24 rounded-full" /></td>
                  <td><div className="skeleton h-3 w-32" /></td>
                  <td><div className="skeleton h-3 w-28" /></td>
                  <td><div className="skeleton h-3 w-20" /></td>
                  <td><div className="skeleton h-3 w-24" /></td>
                  <td><div className="skeleton h-5 w-16 rounded-full" /></td>
                  <td>
                    <div className="flex gap-1">
                      <div className="skeleton w-7 h-7 rounded-lg" />
                      <div className="skeleton w-7 h-7 rounded-lg" />
                      <div className="skeleton w-7 h-7 rounded-lg" />
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

// ── Employee Modal ──
const EmployeeModal = ({ employee, onClose, onSaved }) => {
  const [form, setForm] = useState(() => employee
    ? { ...employee, role: employee.role_name || 'Staff', manager_id: employee.manager_id || '' }
    : { name: '', email: '', phone: '', department: '', designation: '', salary: '', joining_date: '', address: '', pan_number: '', role: 'Staff', manager_id: '' }
  );
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(employee?.photo_url || null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await api.get('/employees?limit=300');
        if (res.data && res.data.data) {
          const list = res.data.data.filter(
            emp => emp.role_name === 'Manager' && emp.id !== employee?.id
          );
          setManagers(list);
        }
      } catch (err) {
        console.error('Failed to load managers:', err);
      }
    };
    fetchManagers();
  }, [employee]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be < 2MB');
    const reader = new FileReader();
    reader.onloadend = () => { setPhotoPreview(reader.result); setPhotoBase64(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        photo_url: photoBase64 || undefined,
        manager_id: form.manager_id || null
      };
      if (employee) {
        await api.put(`/employees/${employee.id}`, payload);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', payload);
        toast.success('Employee created and welcome email sent!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <UserPlus size={15} strokeWidth={2} className="text-white" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          {/* Photo picker */}
          <div className="col-span-2 flex flex-col items-center gap-2">
            <label className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-200"
                   style={{ border: '2px dashed var(--border-input)', background: 'var(--bg-input)' }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
                    <UserPlus size={20} strokeWidth={1.5} />
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Photo</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Max 2MB · JPG, PNG, WebP</p>
          </div>

          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Full Name *</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="John Doe" />
          </div>
          <div className="input-group col-span-2 sm:col-span-1">
            <label className="input-label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="john@hps.com" />
          </div>
          <div className="input-group">
            <label className="input-label">Role *</label>
            <select className="select" value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
              <option value="Staff">Staff</option>
              <option value="Manager">Manager</option>
              <option value="Accountant">Accountant</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Reports To (Manager)</label>
            <select className="select" value={form.manager_id || ''} onChange={e => setForm({...form, manager_id: e.target.value || ''})}>
              <option value="">No Manager (None)</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.employee_code})</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Phone</label>
            <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91-9000000000" />
          </div>
          <div className="input-group">
            <label className="input-label">Department</label>
            <select className="select" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Designation</label>
            <input className="input" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Software Engineer" />
          </div>
          <div className="input-group">
            <label className="input-label">Salary (₹/month)</label>
            <input className="input" type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} placeholder="45000" />
          </div>
          <div className="input-group">
            <label className="input-label">Joining Date</label>
            <input className="input" type="date" value={form.joining_date} onChange={e => setForm({...form, joining_date: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="input-label">PAN Number</label>
            <input className="input" value={form.pan_number} onChange={e => setForm({...form, pan_number: e.target.value})} placeholder="ABCDE1234F" />
          </div>
          <div className="input-group col-span-2">
            <label className="input-label">Address</label>
            <textarea className="input resize-none h-20" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address..." />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border-card)' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {employee ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      if (search) params.set('search', search);
      if (department) params.set('department', department);
      const res = await api.get(`/employees?${params}`);
      setEmployees(res.data.data);
      setPagination(p => ({ ...p, ...res.data.pagination }));
    } catch (e) {
      setEmployees([]);
      if (!silent) toast.error('Failed to load employee records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, department, pagination.page]);

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(() => {
      fetchEmployees(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchEmployees]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deactivated');
      fetchEmployees(true);
    } catch (e) { toast.error('Failed to deactivate'); }
  };

  const activeCount = employees.filter(e => e.is_active).length;

  if (loading) return <EmployeesSkeleton />;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }} className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} strokeWidth={2} className="text-indigo-400" />
            <h1 className="page-title">Employee Management</h1>
          </div>
          <p className="page-subtitle">{pagination.total || employees.length} employees registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchEmployees(true)} className="btn-ghost btn-icon" disabled={refreshing}>
            <RefreshCw size={15} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setEditEmployee(null); setShowModal(true); }} className="btn-primary">
            <UserPlus size={15} strokeWidth={2} /> Add Employee
          </button>
        </div>
      </motion.div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: employees.length, icon: Users, color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
          { label: 'Active', value: activeCount, icon: UserCheck, color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
          { label: 'Inactive', value: employees.length - activeCount, icon: UserX, color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3, ease: [0.16,1,0.3,1] }}
            className="card flex items-center gap-3"
            style={{ border: `1px solid ${s.border}`, background: s.bg }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.icon size={18} strokeWidth={2} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.3, ease: [0.16,1,0.3,1] }}
        className="card-glass flex flex-wrap items-center gap-3">
        <Search size={14} strokeWidth={2} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
        <div className="relative flex-1 min-w-48">
          <input
            className="input pl-4"
            placeholder="Search by name, email, code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select w-44" value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <button className="btn-secondary gap-2">
          <Download size={14} strokeWidth={2} /> Export
        </button>
      </motion.div>

      {/* ── Table ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.35, ease: [0.16,1,0.3,1] }}
        className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th><div className="flex items-center gap-1"><Phone size={10} strokeWidth={2.5} />Phone</div></th>
                <th><div className="flex items-center gap-1"><IndianRupee size={10} strokeWidth={2.5} />Salary</div></th>
                <th><div className="flex items-center gap-1"><Calendar size={10} strokeWidth={2.5} />Joined</div></th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Users size={36} strokeWidth={1} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No employees found</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Add your first employee using the button above</p>
                  </td>
                </tr>
              ) : employees.map((emp, idx) => (
                <motion.tr key={emp.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.025, duration: 0.22 }}>
                  <td>
                    <div className="flex items-center gap-3">
                      {emp.photo_url ? (
                        <img src={emp.photo_url} alt={emp.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                             style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                          {emp.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{emp.name}</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{emp.employee_code} · {emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {emp.department
                      ? <span className="badge-blue">{emp.department}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{emp.designation || '—'}</td>
                  <td className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{emp.phone || '—'}</td>
                  <td className="font-semibold text-sm" style={{ color: '#34d399' }}>
                    ₹{parseFloat(emp.salary || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <span className={emp.is_active ? 'badge-green' : 'badge-red'}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/offer-letters?employeeId=${emp.id}`)}
                        className="btn-ghost p-1.5 rounded-lg"
                        style={{ color: '#34d399' }}
                        title="Generate Offer Letter">
                        <FileText size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => { setEditEmployee(emp); setShowModal(true); }}
                        className="btn-ghost p-1.5 rounded-lg"
                        style={{ color: '#818cf8' }}
                        title="Edit">
                        <Edit size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id, emp.name)}
                        className="btn-ghost p-1.5 rounded-lg"
                        style={{ color: '#f87171' }}
                        title="Deactivate">
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {employees.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3"
               style={{ borderTop: '1px solid var(--table-border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{employees.length}</span> of{' '}
              <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{pagination.total || employees.length}</span> employees
            </p>
          </div>
        )}
      </motion.div>

      {/* ── Modal ── */}
      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          onSaved={() => fetchEmployees(true)}
        />
      )}
    </div>
  );
}
