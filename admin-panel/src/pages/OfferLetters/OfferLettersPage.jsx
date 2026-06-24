import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Plus, FileText, Send } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Shimmer Skeleton ──
function OfferLettersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-56" />
          <div className="skeleton skeleton-text w-64" />
        </div>
        <div className="skeleton skeleton-button w-36" />
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {['Offer #', 'Candidate', 'Designation', 'Department', 'Salary (₹/mo)', 'Joining Date', 'Status', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td><div className="skeleton h-5 w-24" /></td>
                  <td>
                    <div className="space-y-1.5">
                      <div className="skeleton h-4 w-32" />
                      <div className="skeleton h-3 w-40" />
                    </div>
                  </td>
                  <td><div className="skeleton h-4 w-28" /></td>
                  <td><div className="skeleton h-4 w-24" /></td>
                  <td><div className="skeleton h-4 w-20" /></td>
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

export default function OfferLettersPage() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ candidate_name: '', candidate_email: '', candidate_phone: '', designation: '', department: '', salary: '', joining_date: '', valid_until: '' });
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLetters();
    fetchEmployees();
    const interval = setInterval(() => {
      fetchLetters(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const empId = searchParams.get('employeeId');
      if (empId) {
        const emp = employees.find(x => x.id === empId);
        if (emp) {
          setForm({
            candidate_name: emp.name || '',
            candidate_email: emp.email || '',
            candidate_phone: emp.phone || '',
            designation: emp.designation || '',
            department: emp.department || '',
            salary: emp.salary ? Math.round(parseFloat(emp.salary)).toString() : '',
            joining_date: emp.joining_date ? emp.joining_date.substring(0, 10) : '',
            valid_until: ''
          });
          setSelectedEmpId(empId);
          setShowModal(true);
          // Clear query parameter
          navigate('/offer-letters', { replace: true });
        }
      }
    }
  }, [employees, location.search, navigate]);

  const fetchLetters = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/documents/offer-letters');
      setLetters(res.data.data || []);
    } catch (e) {
      setLetters([]);
      if (!silent) toast.error('Failed to load offer letters.');
    } finally { if (!silent) setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?limit=200');
      setEmployees(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch employees', e);
    }
  };

  const handleSelectEmployee = (empId) => {
    setSelectedEmpId(empId);
    if (empId) {
      const emp = employees.find(x => x.id === empId);
      if (emp) {
        setForm({
          candidate_name: emp.name || '',
          candidate_email: emp.email || '',
          candidate_phone: emp.phone || '',
          designation: emp.designation || '',
          department: emp.department || '',
          salary: emp.salary ? Math.round(parseFloat(emp.salary)).toString() : '',
          joining_date: emp.joining_date ? emp.joining_date.substring(0, 10) : '',
          valid_until: ''
        });
      }
    } else {
      setForm({
        candidate_name: '',
        candidate_email: '',
        candidate_phone: '',
        designation: '',
        department: '',
        salary: '',
        joining_date: '',
        valid_until: ''
      });
    }
  };

  const handleOpenModal = () => {
    setSelectedEmpId('');
    setForm({ candidate_name: '', candidate_email: '', candidate_phone: '', designation: '', department: '', salary: '', joining_date: '', valid_until: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmpId('');
    setForm({ candidate_name: '', candidate_email: '', candidate_phone: '', designation: '', department: '', salary: '', joining_date: '', valid_until: '' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents/offer-letters', form);
      toast.success('Offer letter created');
      setShowModal(false); fetchLetters();
    } catch (err) { toast.error('Failed'); }
  };

  const generatePdf = async (id) => {
    try {
      const res = await api.post(`/documents/offer-letters/${id}/generate-pdf`);
      toast.success('PDF generated!');
      window.open(`http://localhost:5000${res.data.data.pdfUrl}`, '_blank');
    } catch (e) { toast.error('Failed'); }
  };

  const sendLetter = async (id, name) => {
    try {
      await api.post(`/documents/offer-letters/${id}/send`);
      toast.success(`Offer letter sent to ${name}`);
      fetchLetters();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const statusBadge = { Generated: 'badge-blue', Sent: 'badge-green', Accepted: 'badge-green', Declined: 'badge-red', Expired: 'badge-gray' };

  if (loading) return <OfferLettersSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Offer Letters</h1>
          <p className="page-subtitle">Generate and send professional offer letters</p>
        </div>
        <button onClick={handleOpenModal} className="btn-primary">
          <Plus className="w-4 h-4" /> New Offer Letter
        </button>
      </div>

      <div className="card p-0">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Offer #</th><th>Candidate</th><th>Designation</th><th>Department</th><th>Salary (₹/mo)</th><th>Joining Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {letters.map((l) => (
                <tr key={l.id}>
                  <td className="text-blue-400 font-mono text-sm">{l.offer_number}</td>
                  <td>
                    <p className="text-slate-200 font-medium">{l.candidate_name}</p>
                    <p className="text-slate-500 text-xs">{l.candidate_email}</p>
                  </td>
                  <td className="text-slate-300">{l.designation}</td>
                  <td className="text-slate-400">{l.department}</td>
                  <td className="text-emerald-400">₹{parseFloat(l.salary || 0).toLocaleString('en-IN')}</td>
                  <td className="text-slate-400 text-sm">{l.joining_date ? new Date(l.joining_date).toLocaleDateString('en-IN') : '-'}</td>
                  <td><span className={statusBadge[l.status] || 'badge-gray'}>{l.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => generatePdf(l.id)} className="btn-secondary btn-sm"><FileText className="w-3 h-3" /></button>
                      {l.status === 'Generated' && (
                        <button onClick={() => sendLetter(l.id, l.candidate_name)} className="btn-primary btn-sm"><Send className="w-3 h-3" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-xl font-bold text-slate-100">Create Offer Letter</h2>
              <button onClick={handleCloseModal} className="btn-ghost p-2">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 input-group">
                <label className="input-label">Select Staff Member (Optional to autofill)</label>
                <select
                  className="select"
                  value={selectedEmpId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                >
                  <option value="">-- Manual Input / Select Staff --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_code} - {emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Candidate Name *', key: 'candidate_name', required: true },
                { label: 'Email *', key: 'candidate_email', type: 'email', required: true },
                { label: 'Phone', key: 'candidate_phone' },
                { label: 'Designation', key: 'designation' },
                { label: 'Department', key: 'department' },
                { label: 'Salary (₹/month)', key: 'salary', type: 'number' },
                { label: 'Joining Date', key: 'joining_date', type: 'date' },
                { label: 'Valid Until', key: 'valid_until', type: 'date' },
              ].map((f) => (
                <div key={f.key} className="input-group">
                  <label className="input-label">{f.label}</label>
                  <input className="input" type={f.type || 'text'} required={f.required} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <div className="col-span-2 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Offer Letter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
