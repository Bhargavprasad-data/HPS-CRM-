import { useState, useEffect, useCallback } from 'react';
import { IndianRupee, FileText, Send, CheckCircle, Play, Plus, Users, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function PayrollSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-glass flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3 w-20 rounded-lg" />
              <div className="skeleton h-5 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="card p-0">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-4 flex-1 rounded-lg" />
              <div className="skeleton h-4 w-24 rounded-lg" />
              <div className="skeleton h-4 w-20 rounded-lg" />
              <div className="skeleton h-6 w-16 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filters, setFilters] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processForm, setProcessForm] = useState({ employee_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'Unpaid', custom_salary: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', employee_name: '', basic_salary: '', present_days: '', status: 'Unpaid' });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        api.get(`/payroll?month=${filters.month}&year=${filters.year}&limit=50`),
        api.get('/employees?limit=100'),
      ]);
      setPayrolls(payRes.data.data || []);
      setEmployees(empRes.data.data || []);
    } catch (e) {
      setPayrolls([]);
      if (!silent) toast.error('Failed to load payroll entries.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleOpenProcessModal = () => {
    setProcessForm({
      employee_id: '',
      month: filters.month,
      year: filters.year,
      status: 'Unpaid',
      custom_salary: ''
    });
    setShowProcessModal(true);
  };

  const handleEmployeeChange = (empId) => {
    const selectedEmp = employees.find(e => e.id === empId);
    setProcessForm(prev => ({
      ...prev,
      employee_id: empId,
      custom_salary: selectedEmp ? selectedEmp.salary : ''
    }));
  };

  const processPayroll = async (e) => {
    e.preventDefault();
    const key = processForm.employee_id;
    setProcessing((p) => ({ ...p, [key]: true }));
    try {
      await api.post('/payroll/process', processForm);
      toast.success('Payroll processed successfully!');
      setShowProcessModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process payroll');
    } finally {
      setProcessing((p) => ({ ...p, [key]: false }));
    }
  };

  const generateSlip = async (id) => {
    setProcessing((p) => ({ ...p, [id + '_pdf']: true }));
    try {
      const res = await api.post(`/payroll/${id}/generate-slip`);
      toast.success('Salary slip generated!');
      window.open(`http://localhost:5000${res.data.data.pdfUrl}`, '_blank');
      fetchData();
    } catch (e) { toast.error('Failed to generate slip'); }
    finally { setProcessing((p) => ({ ...p, [id + '_pdf']: false })); }
  };

  const sendSlip = async (id, name) => {
    setProcessing((p) => ({ ...p, [id + '_send']: true }));
    try {
      await api.post(`/payroll/${id}/send-slip`);
      toast.success(`Salary slip sent to ${name}`);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to send slip'); }
    finally { setProcessing((p) => ({ ...p, [id + '_send']: false })); }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/payroll/${id}/mark-paid`, { payment_method: 'Bank Transfer' });
      toast.success('Marked as paid');
      fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  const deletePayroll = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return;
    try {
      await api.delete(`/payroll/${id}`);
      toast.success('Payroll record deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete payroll record.');
    }
  };

  const handleOpenEditModal = (p) => {
    setEditForm({
      id: p.id,
      employee_name: p.employee_name,
      basic_salary: p.basic_salary,
      present_days: p.present_days,
      status: p.status
    });
    setShowEditModal(true);
  };

  const handleUpdatePayroll = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/payroll/${editForm.id}`, {
        basic_salary: editForm.basic_salary,
        present_days: editForm.present_days,
        status: editForm.status
      });
      toast.success('Payroll updated successfully!');
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payroll');
    }
  };

  const fmt = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;

  const totalNet = payrolls.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0);
  const paidCount = payrolls.filter((p) => p.status === 'Paid').length;

  if (loading) return <PayrollSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">{MONTHS[filters.month]} {filters.year} · {payrolls.length} employees</p>
        </div>
        <div className="flex gap-2">
          <select className="select w-36" value={filters.month} onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}>
            {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" className="input w-24" value={filters.year} onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })} min="2020" max="2030" />
          <button onClick={handleOpenProcessModal} className="btn-primary">
            <Plus className="w-4 h-4" /> Process Payroll
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Total Payroll</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{fmt(totalNet)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Paid</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{paidCount} / {payrolls.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">Pending Payout</p>
            <p className="text-xl font-extrabold text-amber-400 mt-0.5">
              {fmt(payrolls.filter((p) => p.status !== 'Paid').reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Basic</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-[var(--text-secondary)] text-sm">No payroll entries for this period.</td></tr>
              ) : payrolls.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">{p.employee_name}</p>
                      <p className="text-[var(--text-secondary)] text-xs">{p.employee_code} · {p.department}</p>
                    </div>
                  </td>
                  <td className="text-[var(--text-primary)]">{fmt(p.basic_salary)}</td>
                  <td className="text-blue-400">{fmt((p.hra || 0) + (p.transport_allowance || 0) + (p.other_allowances || 0))}</td>
                  <td className="text-red-400">{fmt((p.pf_deduction || 0) + (p.tax_deduction || 0))}</td>
                  <td className="text-emerald-400 font-bold">{fmt(p.net_salary)}</td>
                  <td className="text-[var(--text-secondary)] text-sm">{p.present_days}/{p.working_days} days</td>
                  <td><span className={p.status === 'Paid' ? 'badge-green' : p.status === 'Processing' ? 'badge-yellow' : 'badge-red'}>{p.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => generateSlip(p.id)}
                        disabled={processing[p.id + '_pdf']}
                        className="btn-secondary btn-sm"
                        title="Generate PDF Slip"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => sendSlip(p.id, p.employee_name)}
                        disabled={processing[p.id + '_send']}
                        className="btn-secondary btn-sm"
                        title="Email Slip"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                      {p.status !== 'Paid' && (
                        <button onClick={() => markPaid(p.id)} className="btn-success btn-sm">
                          <CheckCircle className="w-3 h-3" /> Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="btn-secondary btn-sm"
                        title="Edit Payroll"
                      >
                        <Edit className="w-3 h-3 text-blue-400" />
                      </button>
                      <button
                        onClick={() => deletePayroll(p.id)}
                        className="btn-danger btn-sm"
                        title="Delete Payroll"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Modal */}
      {showProcessModal && (
        <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Process Payroll</h2>
              <button onClick={() => setShowProcessModal(false)} className="btn-ghost p-2">✕</button>
            </div>
            <form onSubmit={processPayroll} className="p-6 space-y-4">
              <div className="input-group">
                <label className="input-label">Employee *</label>
                <select className="select" required value={processForm.employee_id} onChange={(e) => handleEmployeeChange(e.target.value)}>
                  <option value="">Select Employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Month</label>
                  <select className="select" value={processForm.month} onChange={(e) => setProcessForm({ ...processForm, month: parseInt(e.target.value) })}>
                    {MONTHS.slice(1).map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Year</label>
                  <input type="number" className="input" value={processForm.year} onChange={(e) => setProcessForm({ ...processForm, year: parseInt(e.target.value) })} min="2020" max="2030" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Salary (Basic)</label>
                  <input type="number" className="input" placeholder="Enter basic salary" value={processForm.custom_salary} onChange={(e) => setProcessForm({ ...processForm, custom_salary: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select className="select" value={processForm.status} onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowProcessModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  <Play className="w-4 h-4" /> Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Payroll</h2>
              <button onClick={() => setShowEditModal(false)} className="btn-ghost p-2">✕</button>
            </div>
            <form onSubmit={handleUpdatePayroll} className="p-6 space-y-4">
              <div className="input-group">
                <label className="input-label">Employee</label>
                <input type="text" className="input bg-slate-800" disabled value={editForm.employee_name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Basic Salary</label>
                  <input type="number" className="input" required value={editForm.basic_salary} onChange={(e) => setEditForm({ ...editForm, basic_salary: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Present Days</label>
                  <input type="number" className="input" required value={editForm.present_days} onChange={(e) => setEditForm({ ...editForm, present_days: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Processing">Processing</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
