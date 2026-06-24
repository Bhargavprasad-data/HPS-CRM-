import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../../redux/slices/authSlice';
import {
   Eye, EyeOff, LogIn, Mail, Lock,
   LayoutDashboard, Users, FolderKanban, BarChart3,
   Shield, AlertCircle
 } from 'lucide-react';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: LayoutDashboard, label: 'Admin Dashboard',    desc: 'Real-time org stats and KPIs'             },
  { icon: Users,           label: 'Employee & HR Mgmt', desc: 'Payroll, attendance and team records'     },
  { icon: FolderKanban,    label: 'Projects & Billing', desc: 'Invoices, quotations and project tracking' },
  { icon: BarChart3,       label: 'Reports & Analytics',desc: 'Exportable insights and business reports' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.name}! 👋`);
      navigate('/dashboard');
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}>

      {/* ── Left Panel — Branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #3b0764 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #e879f9, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="HPS Logo" className="w-10 h-10 object-contain shrink-0" onError={(e) => { e.target.src = '/hps_logo.png'; }} />
          <div>
            <p className="text-white font-extrabold text-xl leading-none tracking-wide">HPS</p>
            <p className="text-purple-300 text-[9px] uppercase tracking-widest font-semibold mt-0.5">
              Harsha Perfect Solutions
            </p>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold mb-6">
            <Shield className="w-3.5 h-3.5" /> Admin Portal
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Your Business,<br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #e879f9)' }}>
              All in One Place
            </span>
          </h2>
          <p className="text-purple-200/70 text-base leading-relaxed mb-10">
            Manage employees, customers, projects, billing and analytics — all from a single powerful admin dashboard.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-none">{label}</p>
                  <p className="text-purple-300/60 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-purple-400/50 text-xs">
          © {new Date().getFullYear()} Harsha Perfect Solutions. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel — Form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16"
        style={{ background: 'var(--bg-main)' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <img src="/logo.png" alt="HPS Logo" className="w-9 h-9 object-contain shrink-0" onError={(e) => { e.target.src = '/hps_logo.png'; }} />
          <div>
            <p className="font-extrabold text-lg leading-none" style={{ color: '#7c3aed' }}>HPS</p>
            <p className="text-[8px] uppercase tracking-widest font-semibold mt-0.5"
              style={{ color: 'var(--text-secondary)' }}>Harsha Perfect Solutions</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
              Welcome back 👋
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sign in to your admin account to continue
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-secondary)' }} />
                <input
                  className="input pl-10"
                  type="email"
                  placeholder="admin@hps.com"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => { dispatch(clearError()); setForm({ ...form, email: e.target.value }); }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-secondary)' }} />
                <input
                  className="input pl-10 pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => { dispatch(clearError()); setForm({ ...form, password: e.target.value }); }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base font-bold mt-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn className="w-4 h-4" /> Sign In to Portal</>
              }
            </button>
          </form>

          {/* Other portals */}
          <div className="mt-6 text-center">
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>Other portals</p>
            <div className="flex justify-center gap-5 text-xs">
              {[
                { label: 'Manager', href: 'http://localhost:3001' },
                { label: 'Staff',   href: 'http://localhost:3002' },
                { label: 'Accountant', href: 'http://localhost:3003' },
              ].map((link) => (
                <a key={link.label} href={link.href}
                  className="font-semibold transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
