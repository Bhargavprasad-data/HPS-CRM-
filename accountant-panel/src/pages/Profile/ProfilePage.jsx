import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../redux/slices/authSlice';
import {
  User, Mail, Phone, Building2, Briefcase,
  Camera, Lock, Eye, EyeOff, Save, CheckCircle, Shield
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ── Skeleton loader ──────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="card flex items-center gap-6">
        <div className="skeleton-circle w-24 h-24" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-5 w-40 rounded-xl" />
          <div className="skeleton h-3 w-56 rounded-lg" />
        </div>
      </div>
      <div className="card space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton h-3 w-20 rounded-lg" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [photoPreview, setPhotoPreview] = useState(user?.photo_url || user?.photo || null);
  const [photoBase64,  setPhotoBase64]  = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [pwSaving,     setPwSaving]     = useState(false);
  const [showOld,      setShowOld]      = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showCnf,      setShowCnf]      = useState(false);

  const [form, setForm] = useState({
    name:        user?.name        || '',
    email:       user?.email       || '',
    phone:       user?.phone       || '',
    department:  user?.department  || '',
    designation: user?.designation || '',
  });

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const fileRef = useRef();

  /* ── Photo pick ── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setPhotoPreview(reader.result); setPhotoBase64(reader.result); };
    reader.readAsDataURL(file);
  };

  /* ── Save profile ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        email:       form.email.trim(),
        phone:       form.phone.trim()       || undefined,
        department:  form.department.trim()  || undefined,
        designation: form.designation.trim() || undefined,
        photo_url:   photoBase64             || undefined,
      };
      const res = await api.put('/auth/update-profile', payload);
      if (res.data.success) {
        const updated = { ...user, ...res.data.data };
        dispatch(setUser(updated));
        toast.success('Profile updated successfully!');
        setPhotoBase64(null);
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ── */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword)                                   { toast.error('Current password is required'); return; }
    if (pwForm.newPassword.length < 8)                         { toast.error('New password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword)         { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      const res = await api.post('/auth/change-password', {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      if (res.data.success) {
        toast.success('Password changed successfully!');
        setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(res.data.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return <ProfileSkeleton />;

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'A';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account details and security settings</p>
      </div>

      {/* ── Avatar card ── */}
      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group shrink-0">
          <div
            className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-[var(--border-input)] hover:border-amber-500 transition-colors cursor-pointer shadow-xl"
            onClick={() => fileRef.current?.click()}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{user.name}</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">{user.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
            <span className="badge-amber">{user.role || 'Accountant'}</span>
            {user.department && <span className="badge-blue">{user.department}</span>}
            {user.designation && <span className="badge-gray">{user.designation}</span>}
          </div>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="btn-secondary btn-sm shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          Change Photo
        </button>
      </div>

      {/* ── Edit form ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-card)]">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold text-sm">Personal Information</h3>
            <p className="text-[var(--text-secondary)] text-xs">Update your profile details</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="input-label">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  className="input pl-10"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  className="input pl-10 opacity-60 cursor-not-allowed"
                  type="email"
                  value={form.email}
                  readOnly
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="input-label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  className="input pl-10"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="input-label">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] z-10" />
                <select
                  className="select pl-10"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  {['Finance', 'Sales', 'IT & Development', 'Marketing', 'HR', 'Operations', 'Customer Support'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Designation */}
            <div className="sm:col-span-2">
              <label className="input-label">Designation</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  className="input pl-10"
                  type="text"
                  placeholder="Senior Accountant"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Password card ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-card)]">
          <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold text-sm">Change Password</h3>
            <p className="text-[var(--text-secondary)] text-xs">Keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="input-label">Current Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                className="input pl-10 pr-10"
                type={showOld ? 'text' : 'password'}
                placeholder="Your current password"
                value={pwForm.oldPassword}
                onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
              />
              <button type="button" onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New password */}
            <div>
              <label className="input-label">New Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  className="input pl-10 pr-10"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="input-label">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  className="input pl-10 pr-10"
                  type={showCnf ? 'text' : 'password'}
                  placeholder="Verify new password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                />
                <button type="button" onClick={() => setShowCnf(!showCnf)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  {showCnf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={pwSaving} className="btn-danger">
              {pwSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
