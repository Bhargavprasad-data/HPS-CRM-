import { useState, useEffect } from 'react';
import { CreditCard, Plus, Download, QrCode } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Shimmer Skeleton ──
function IdCardsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-52" />
          <div className="skeleton skeleton-text w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card space-y-4">
            <div className="skeleton h-[340px] w-full rounded-2xl" />
            <div className="skeleton h-4 w-24 mx-auto" />
            <div className="flex gap-2">
              <div className="skeleton h-8 flex-1 rounded-lg" />
              <div className="skeleton h-8 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IdCardsPage() {
  const [employees, setEmployees] = useState([]);
  const [idCards, setIdCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({});

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [empRes, cardRes] = await Promise.all([
        api.get('/employees?limit=100'),
        api.get('/documents/id-cards'),
      ]);
      setEmployees(empRes.data.data || []);
      setIdCards(cardRes.data.data || []);
    } catch (e) {
      setEmployees([
        { id: '1', employee_code: 'HPS-001', name: 'Admin User', department: 'Administration', designation: 'System Administrator', photo_url: null },
        { id: '2', employee_code: 'HPS-002', name: 'Manager User', department: 'Operations', designation: 'Operations Manager', photo_url: null },
        { id: '3', employee_code: 'HPS-003', name: 'Staff User', department: 'Development', designation: 'Software Engineer', photo_url: null },
      ]);
      setIdCards([]);
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const generate = async (employeeId, name) => {
    setGenerating((g) => ({ ...g, [employeeId]: true }));
    try {
      const res = await api.post(`/documents/id-cards/generate/${employeeId}`);
      toast.success(`ID card generated for ${name}`);
      window.open(`http://localhost:5000${res.data.data.pdfUrl}?t=${new Date().getTime()}`, '_blank');
      fetchData();
    } catch (e) { toast.error('Failed to generate ID card'); }
    finally { setGenerating((g) => ({ ...g, [employeeId]: false })); }
  };

  const generatedIds = idCards.map((c) => c.employee_id);

  if (loading) return <IdCardsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">ID Card Management</h1>
          <p className="page-subtitle">Generate digital ID cards with QR codes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((emp) => {
          const hasCard = generatedIds.includes(emp.id);
          const card = idCards.find((c) => c.employee_id === emp.id);
          return (
            <div key={emp.id} className="card group hover:border-blue-500/30 transition-all duration-200">
              {/* ID Card Preview */}
              <div 
                className="rounded-2xl p-4 mb-4 relative overflow-hidden flex flex-col justify-between shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                  height: '340px'
                }}
              >
                {/* Midnight blue circle overlays */}
                <div className="absolute -top-10 -left-10 w-28 h-28 rounded-full bg-[#03224c]/40" />
                <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-[#03224c]/40" />
                <div className="absolute -bottom-5 -left-5 w-16 h-16 rounded-full bg-[#0284c7]/50" />

                {/* White Logo Container */}
                <div className="bg-white rounded-md py-1 px-3 flex items-center justify-center mx-auto relative z-10 w-[70%] shadow-sm">
                  <img src="/hps_logo.png" alt="HPS Logo" className="h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                  <span className="text-[#0f70b7] font-bold text-xs ml-1">HPS</span>
                </div>

                {/* Photo container */}
                <div className="bg-[#081325] rounded-2xl w-[75%] h-[160px] mx-auto flex items-center justify-center overflow-hidden border border-[#081325] relative z-10 shadow-md my-3">
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider">No Photo</div>
                  )}
                </div>

                {/* Info Section */}
                <div className="text-left pl-1 pb-1 relative z-10">
                  <h3 className="text-white font-extrabold text-xs uppercase leading-tight tracking-wide truncate">{emp.name}</h3>
                  <p className="text-[#00376b] font-extrabold text-[9px] uppercase tracking-wide mt-0.5 truncate">{emp.designation || 'Employee'}</p>
                  <p className="text-white font-extrabold text-[9px] mt-0.5 tracking-wide">ID: {emp.employee_code ? emp.employee_code.toUpperCase().replace('-', ' ') : ''}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs text-center mb-3">{emp.department}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => generate(emp.id, emp.name)}
                  disabled={generating[emp.id]}
                  className={`flex-1 ${hasCard ? 'btn-secondary' : 'btn-primary'} btn-sm justify-center gap-1.5`}
                >
                  {generating[emp.id] ? (
                    <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : <CreditCard className="w-3.5 h-3.5" />}
                  {hasCard ? 'Regenerate' : 'Generate'}
                </button>
                {hasCard && card?.pdf_url && (
                  <a
                    href={`http://localhost:5000${card.pdf_url}?t=${new Date().getTime()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary btn-sm px-3"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {hasCard && (
                <div className="mt-2 flex items-center gap-1.5 justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <p className="text-emerald-400 text-xs">Card generated</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
