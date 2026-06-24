import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, EyeOff, UserPlus, Mail, Lock, Phone,
  Briefcase, Building2, Camera, CheckCircle2,
  ArrowLeft, Shield, Users, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DEPARTMENTS = [
  'Sales',
  'IT & Development',
  'Marketing',
  'HR',
  'Finance',
  'Operations',
  'Customer Support',
];

const BENEFITS = [
  { icon: Shield,        text: 'Secure & encrypted data'          },
  { icon: Users,         text: 'Collaborative team workspace'      },
  { icon: Star,          text: 'Premium dashboard experience'      },
  { icon: CheckCircle2,  text: 'Instant access after registration' },
];

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="input-label">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10"
        style={{ color: 'var(--text-secondary)' }} />
      {children}
    </div>
  </div>
);

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: 'IT & Development',
    designation: '',
  });
  const [showPass, setShowPass]           = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [photoPreview, setPhotoPreview]   = useState(null);
  const [photoBase64, setPhotoBase64]     = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image size must be less than 2MB');
    const reader = new FileReader();
    reader.onloadend = () => { setPhotoPreview(reader.result); setPhotoBase64(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())                              return toast.error('Full name is required');
    if (!form.email.trim())                             return toast.error('Email is required');
    if (form.password.length < 8)                       return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword)         return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name:        form.name.trim(),
        email:       form.email.trim(),
        password:    form.password,
        phone:       form.phone.trim() || undefined,
        department:  form.department,
        designation: form.designation.trim() || undefined,
        photo_url:   photoBase64 || undefined,
      });
      if (res.data.success) {
        toast.success('Account created! Please sign in. 🎉');
        navigate('/login');
      } else {
        toast.error(res.data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}
    >
      {/* ── Left Panel – Branding ─────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[38%] relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(135deg, #0c0a1e 0%, #1e1b4b 50%, #3b0764 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-[-60px] left-[-60px] w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #e879f9, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/hps_logo.png" alt="HPS Logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-white font-extrabold text-xl leading-none tracking-wide">HPS</p>
            <p className="text-purple-300 text-[9px] uppercase tracking-widest font-semibold mt-0.5">
              Harsha Perfect Solutions
            </p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold mb-6">
            <UserPlus className="w-3.5 h-3.5" /> Create Your Account
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Join the<br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #e879f9)' }}>
              HPS Family
            </span>
          </h2>
          <p className="text-purple-200/70 text-base leading-relaxed mb-10">
            Register your staff account to access the premium workforce management portal.
          </p>

          <div className="space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-purple-200/80 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-purple-400/50 text-xs">
          © 2024 Harsha Perfect Solutions. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel – Form ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto"
        style={{ background: 'var(--bg-main)' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <img src="/hps_logo.png" alt="HPS Logo" className="w-9 h-9 object-contain" />
          <div>
            <p className="font-extrabold text-lg leading-none text-blue-500">HPS</p>
            <p className="text-[8px] uppercase tracking-widest font-semibold mt-0.5"
              style={{ color: 'var(--text-secondary)' }}>Harsha Perfect Solutions</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          {/* Back link */}
          <Link to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-6 transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
              Create account ✨
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Fill in your details to join the HPS staff portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Profile Photo ── */}
            <div className="flex items-center gap-4 p-4 rounded-2xl mb-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
              <label className="relative cursor-pointer shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center transition-all"
                  style={{
                    background: photoPreview ? 'transparent' : 'var(--bg-hover)',
                    border: `2px dashed ${photoPreview ? 'transparent' : 'rgba(124,58,237,0.3)'}`,
                  }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                    : <Camera className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
                  }
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              </label>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Profile Photo</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Click to upload · Max 2 MB · Optional</p>
                {photoPreview && (
                  <button type="button" onClick={() => { setPhotoPreview(null); setPhotoBase64(null); }}
                    className="text-xs mt-1 text-red-400 hover:text-red-300 transition-colors">
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* ── Two-column grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <Field label="Full Name *" icon={UserPlus}>
                <input className="input pl-10" type="text" placeholder="John Doe" required
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>

              {/* Email */}
              <Field label="Email Address *" icon={Mail}>
                <input className="input pl-10" type="email" placeholder="john@hps.com" required
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>

              {/* Phone */}
              <Field label="Phone Number" icon={Phone}>
                <input className="input pl-10" type="tel" placeholder="+91 9876543210"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>

              {/* Designation */}
              <Field label="Designation" icon={Briefcase}>
                <input className="input pl-10" type="text" placeholder="Software Engineer"
                  value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </Field>
            </div>

            {/* Department — full width */}
            <Field label="Department" icon={Building2}>
              <select className="select pl-10" value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{d}</option>
                ))}
              </select>
            </Field>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="input-label">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-secondary)' }} />
                  <input className="input pl-10 pr-10" type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 characters" required
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="input-label">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-secondary)' }} />
                  <input className="input pl-10 pr-10" type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Verify password" required
                    value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password strength hint */}
            {form.password.length > 0 && (
              <div className="flex items-center gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: i < Math.min(Math.floor(form.password.length / 3), 4)
                        ? (form.password.length >= 10 ? '#10b981' : form.password.length >= 7 ? '#f59e0b' : '#ef4444')
                        : 'var(--border-card)'
                    }} />
                ))}
                <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                  {form.password.length < 8 ? 'Too short' : form.password.length < 10 ? 'Fair' : 'Strong'}
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base font-bold mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><UserPlus className="w-4 h-4" /> Create My Account</>
              }
            </button>

            {/* Sign in link */}
            <p className="text-center text-sm pt-2" style={{ color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <Link to="/login" className="font-semibold transition-colors"
                style={{ color: 'var(--accent-light)' }}>
                Sign In →
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
