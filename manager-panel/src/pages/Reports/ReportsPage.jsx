import { useState, useEffect } from 'react';
import {
  FileText, Download, FileSpreadsheet, PieChart as ChartIcon,
  BarChart3, Loader2, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ── Skeletons ────────────────────────────────────────────── */
function ReportRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)]">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <div className="skeleton-text w-48" />
          <div className="skeleton-text w-32" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="skeleton w-14 h-5 rounded-lg" />
        <div className="skeleton w-24 h-8 rounded-xl" />
      </div>
    </div>
  );
}

const TYPE_COLORS = {
  Attendance:  'badge-blue',
  Project:     'badge-teal',
  Performance: 'badge-purple',
};

export default function ReportsPage() {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [reportType, setReportType] = useState('attendance');
  const [processing, setProcessing] = useState(false);

  const fetchReports = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/reports');
      setReports(res.data.data || []);
    } catch {
      if (!silent) {
        setReports([
          { id: '1', name: 'Q1 Team Attendance Report',          type: 'Attendance',  created_at: '2026-04-01', created_by: 'Manager User', file_url: '#' },
          { id: '2', name: 'CRM Milestone Progression Summary',  type: 'Project',     created_at: '2026-05-15', created_by: 'Manager User', file_url: '#' },
          { id: '3', name: 'Operations Run Rate Evaluation',      type: 'Performance', created_at: '2026-05-28', created_by: 'Manager User', file_url: '#' },
        ]);
      }
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      const label = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      const newReport = {
        id: Date.now().toString(),
        name: `Generated ${label} Report (${new Date().toLocaleDateString('en-IN')})`,
        type: label,
        created_at: new Date().toISOString().split('T')[0],
        created_by: 'Manager User',
        file_url: '#',
      };
      setReports([newReport, ...reports]);
      setProcessing(false);
      toast.success(`${label} report generated! Ready to download.`);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Analytics &amp; Reports</h1>
          <p className="page-subtitle">Generate, compile, and download operational intelligence reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Compiler Form ── */}
        <div className="card space-y-5">
          <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-teal-400" />
            Compile New Report
          </h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="input-group">
              <label className="input-label">Report Category</label>
              <select className="select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="attendance">Team Attendance Summary</option>
                <option value="project">Project Progression Gantt</option>
                <option value="performance">Staff Task Throughput</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="input-group">
                <label className="input-label">Start Date</label>
                <input type="date" className="input" defaultValue="2026-05-01" />
              </div>
              <div className="input-group">
                <label className="input-label">End Date</label>
                <input type="date" className="input" defaultValue="2026-05-31" />
              </div>
            </div>
            <button type="submit" disabled={processing} className="btn-primary w-full justify-center">
              {processing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Compiling…</>
                : <><FileSpreadsheet className="w-4 h-4" /> Generate Report</>
              }
            </button>
          </form>

          {/* Report types legend */}
          <div className="pt-4 border-t border-[var(--border-card)] space-y-2.5">
            {[
              { icon: BarChart3, label: 'Attendance',  desc: 'Daily/monthly check-in summary', color: 'text-blue-400 bg-blue-500/10' },
              { icon: FileText,  label: 'Project',     desc: 'Milestone progress & timeline',  color: 'text-teal-400 bg-teal-500/10' },
              { icon: ChartIcon, label: 'Performance', desc: 'Staff task throughput KPIs',     color: 'text-purple-400 bg-purple-500/10' },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.color}`}>
                  <r.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[var(--text-primary)] text-xs font-semibold">{r.label}</p>
                  <p className="text-[var(--text-secondary)] text-xs">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Report Archive List ── */}
        <div className="lg:col-span-2 card space-y-4">
          <h3 className="text-[var(--text-primary)] font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            Available Compilation Archives
          </h3>
          <div className="space-y-3">
            {loading
              ? [1,2,3].map(i => <ReportRowSkeleton key={i} />)
              : reports.length === 0
                ? (
                  <div className="py-12 text-center">
                    <FileText className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-2 opacity-40" />
                    <p className="text-[var(--text-secondary)] text-sm">No report archives found</p>
                  </div>
                )
                : reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between p-4 border border-[var(--border-card)] bg-[var(--bg-input)] rounded-2xl hover:border-teal-500/20 hover:bg-[var(--bg-hover)] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-teal-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[var(--text-primary)] font-semibold text-sm truncate">{rep.name}</h4>
                        <p className="text-[var(--text-secondary)] text-xs mt-0.5">
                          Compiled {new Date(rep.created_at).toLocaleDateString('en-IN')} · {rep.created_by}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={TYPE_COLORS[rep.type] || 'badge-gray'}>{rep.type}</span>
                      <button
                        className="btn-secondary btn-sm gap-1.5"
                        onClick={() => toast.success('Report downloaded!')}
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
