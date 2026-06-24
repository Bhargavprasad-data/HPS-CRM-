import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User, Mail, Phone, Lock, Calendar, CreditCard, MapPin,
  CheckCircle2, IndianRupee, Camera, X, Loader2, Save, KeyRound,
  BadgeCheck, Building2
} from 'lucide-react';
import { setUser } from '../../redux/slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Photo upload states
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Profile edit form state
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change state
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  /* ── Fetch profile ────────────────────────────────────────── */
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      const data = res.data.data;
      setProfileData(data);
      setProfileForm({ name: data.name || '', email: data.email || '' });
    } catch {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  /* ── Photo handling ───────────────────────────────────────── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setPhotoBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoBase64) return;
    setPhotoLoading(true);
    try {
      const res = await api.put('/auth/update-profile', {
        name: profileForm.name || profileData?.name,
        email: profileForm.email || profileData?.email,
        photo_url: photoBase64,
      });
      if (res.data.success) {
        const newPhoto = res.data.data?.photo || photoPreview;
        const updatedUser = { ...user, photo: newPhoto };
        localStorage.setItem('hps_user', JSON.stringify(updatedUser));
        dispatch(setUser(updatedUser));
        setPhotoBase64(null);
        setPhotoPreview(null);
        toast.success('Profile photo updated!');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Photo upload failed.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const cancelPhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Profile details submit ───────────────────────────────── */
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) {
      return toast.error('Name and email are required.');
    }
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/update-profile', {
        name: profileForm.name,
        email: profileForm.email,
      });
      if (res.data.success) {
        const updatedUser = { ...user, name: profileForm.name, email: profileForm.email };
        localStorage.setItem('hps_user', JSON.stringify(updatedUser));
        dispatch(setUser(updatedUser));
        toast.success('Profile updated successfully!');
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  /* ── Password submit ──────────────────────────────────────── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('All password fields are required.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    if (newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters.');
    }
    setPassLoading(true);
    try {
      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        toast.success('Password changed successfully!');
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  /* ── Loading skeleton ─────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const p = profileData || {};
  const displayPhoto = photoPreview || p.photo_url || user?.photo;

  return (
    <div className="space-y-6 pb-6">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and account security</p>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <div
        className="card relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 60%, rgba(124,58,237,0.07) 100%)',
          borderColor: 'rgba(124,58,237,0.15)',
        }}
      >
        <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-violet-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {/* Avatar with Upload */}
          <div className="relative shrink-0 group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl shadow-violet-500/20 ring-2 ring-violet-500/20">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-4xl">
                  {p.name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'S'}
                </div>
              )}
            </div>

            {/* Overlay edit button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-3xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
              title="Change profile photo"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Name / Role block */}
          <div className="text-center md:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {p.name || user?.name || 'Staff Member'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {p.role || 'Staff'}
              </span>
            </div>
            <p className="text-sm flex items-center justify-center md:justify-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Building2 className="w-3.5 h-3.5 text-violet-400" />
              {p.designation || 'Staff'} · {p.department || 'Department'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Employee ID: <span className="font-mono text-violet-400">{p.employee_code || 'HPS-XXX'}</span>
            </p>
          </div>

          {/* Authorized badge */}
          <div className="shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-2 md:ml-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold">Active Account</span>
          </div>
        </div>

        {/* Photo upload action bar */}
        {photoBase64 && (
          <div className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Camera className="w-4 h-4 text-violet-400 shrink-0" />
            <p className="text-sm text-violet-300 flex-1">New photo selected — click Save to upload</p>
            <button
              onClick={handlePhotoUpload}
              disabled={photoLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 15px rgba(124,58,237,0.35)' }}
            >
              {photoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {photoLoading ? 'Uploading…' : 'Save Photo'}
            </button>
            <button
              onClick={cancelPhoto}
              className="p-1.5 rounded-lg text-violet-400 hover:text-violet-200 hover:bg-violet-500/20 transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-5">

          {/* Personal Info Card */}
          <div className="card space-y-5">
            <h3 className="font-semibold flex items-center gap-2 border-b pb-3" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-card)' }}>
              <User className="w-4 h-4 text-violet-400" /> Personal Details
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Phone',        icon: Phone,    val: p.phone || 'N/A' },
                { label: 'Email',        icon: Mail,     val: p.email },
                { label: 'Joining Date', icon: Calendar, val: p.joining_date ? new Date(p.joining_date).toLocaleDateString('en-IN') : 'N/A' },
                { label: 'Basic Salary', icon: IndianRupee, val: p.salary ? `₹${parseFloat(p.salary).toLocaleString('en-IN')}/mo` : 'N/A', accent: true },
              ].map(({ label, icon: Icon, val, accent }) => (
                <div key={label} className="flex justify-between items-center py-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className={`font-medium flex items-center gap-1.5 ${accent ? 'text-emerald-400' : ''}`} style={!accent ? { color: 'var(--text-primary)' } : {}}>
                    <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                    {val}
                  </span>
                </div>
              ))}

              {/* Address */}
              <div className="flex flex-col gap-1 py-1">
                <span className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-3.5 h-3.5" /> Address
                </span>
                <span
                  className="text-xs leading-relaxed rounded-xl p-2.5"
                  style={{ color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border-input)' }}
                >
                  {p.address || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Records Card */}
          <div className="card space-y-5">
            <h3 className="font-semibold flex items-center gap-2 border-b pb-3" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-card)' }}>
              <CreditCard className="w-4 h-4 text-violet-400" /> Financial Records
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Bank Account',      val: p.bank_account || 'N/A' },
                { label: 'IFSC Code',         val: p.ifsc_code || 'N/A' },
                { label: 'PAN Number',        val: p.pan_number || 'N/A' },
                { label: 'Emergency Contact', val: p.emergency_contact || 'N/A' },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between py-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Edit forms */}
        <div className="lg:col-span-2 space-y-5">

          {/* Edit Account Details */}
          <div className="card">
            <h3 className="font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BadgeCheck className="w-4 h-4 text-violet-400" /> Edit Account Details
            </h3>
            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  className="input"
                  type="text"
                  required
                  placeholder="Your full name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  required
                  placeholder="Email address"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <div className="col-span-1 sm:col-span-2 flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {profileLoading ? 'Saving…' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="card">
            <h3 className="font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <KeyRound className="w-4 h-4 text-violet-400" /> Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current password */}
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <div className="relative">
                  <input
                    className="input pr-12"
                    type={showPw.current ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    value={passForm.currentPassword}
                    onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {showPw.current ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* New + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <div className="relative">
                    <input
                      className="input pr-12"
                      type={showPw.new ? 'text' : 'password'}
                      required
                      placeholder="Min. 8 characters"
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {showPw.new ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      className="input pr-12"
                      type={showPw.confirm ? 'text' : 'password'}
                      required
                      placeholder="Repeat new password"
                      value={passForm.confirmPassword}
                      onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {showPw.confirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Strength hint */}
              {passForm.newPassword && (
                <div className="flex items-center gap-2">
                  {[1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: passForm.newPassword.length >= i * 3
                          ? (i <= 2 ? '#f59e0b' : '#10b981')
                          : 'var(--border-input)',
                      }}
                    />
                  ))}
                  <span className="text-[10px] ml-1" style={{ color: 'var(--text-secondary)' }}>
                    {passForm.newPassword.length < 4 ? 'Weak' : passForm.newPassword.length < 8 ? 'Fair' : passForm.newPassword.length < 12 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}

              <div className="flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {passLoading ? 'Updating…' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
