import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User, CheckCircle2, Eye, EyeOff, Save, KeyRound, Pencil } from 'lucide-react';
import { setUser } from '../../redux/slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Shimmer Skeleton ──
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-52" />
          <div className="skeleton skeleton-text w-64" />
        </div>
      </div>
      {/* Profile card skeleton */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="flex items-center gap-5">
          <div className="skeleton w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-3.5 w-48" />
            <div className="skeleton h-3 w-28" />
          </div>
          <div className="skeleton h-8 w-28 rounded-lg" />
        </div>
      </div>
      {/* Forms skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2].map((i) => (
          <div key={i} className="card space-y-4" style={{ padding: '24px' }}>
            <div className="skeleton h-5 w-40 mb-3" />
            <div className="space-y-2"><div className="skeleton h-3 w-16" /><div className="skeleton h-10 w-full rounded-xl" /></div>
            <div className="space-y-2"><div className="skeleton h-3 w-24" /><div className="skeleton h-10 w-full rounded-xl" /></div>
            {i === 2 && <div className="space-y-2"><div className="skeleton h-3 w-28" /><div className="skeleton h-10 w-full rounded-xl" /></div>}
            <div className="flex justify-end"><div className="skeleton h-10 w-36 rounded-xl" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let active = true;
    const checkBackend = async () => {
      try {
        await api.get('/auth/me');
        if (active) setLoading(false);
      } catch (e) {
        if (active) setTimeout(checkBackend, 3000);
      }
    };
    checkBackend();
    return () => { active = false; };
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) {
      return toast.error('Name and email are required.');
    }
    setProfileLoading(true);
    try {
      const response = await api.put('/auth/update-profile', {
        name: profileForm.name,
        email: profileForm.email,
      });
      if (response.data.success) {
        const updatedUser = {
          ...user,
          name: profileForm.name,
          email: profileForm.email,
        };
        localStorage.setItem('hps_user', JSON.stringify(updatedUser));
        dispatch(setUser(updatedUser));
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

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
      return toast.error('Password must be at least 8 characters long.');
    }
    setPassLoading(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (response.data.success) {
        toast.success('Password changed successfully!');
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) return <SettingsSkeleton />;

  const cardStyle = {
    padding: '24px',
    borderRadius: '16px',
  };

  const sectionHeaderStyle = {
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--border-card)',
  };

  const iconBoxStyle = (gradient) => ({
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="page-header"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} strokeWidth={2} className="text-indigo-400" />
            <h1 className="page-title">Profile & Settings</h1>
          </div>
          <p className="page-subtitle">Manage your account information and security preferences</p>
        </div>
      </motion.div>

      {/* ── Profile Display Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="card"
        style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}
      >
        {/* Decorative gradient accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
          borderRadius: '16px 16px 0 0',
        }} />

        <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
          <div
            className="shrink-0"
            style={{
              width: '60px', height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '22px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
            }}
          >
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Admin User'}
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.email || 'admin@hps.com'}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#34d399', boxShadow: '0 0 6px rgba(52, 211, 153, 0.5)',
              }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#34d399' }}>
                Active Administrator
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '7px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Pencil size={12} strokeWidth={2.5} /> Manage Profile
          </button>
        </div>
      </motion.div>

      {/* ── Interactive Forms Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Form 1: Edit Profile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="card"
          style={cardStyle}
        >
          <div style={sectionHeaderStyle}>
            <div style={iconBoxStyle('linear-gradient(135deg, #3b82f6, #2563eb)')}>
              <User size={15} strokeWidth={2.5} color="white" />
            </div>
            <span>Account Details</span>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                className="input"
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                className="input"
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="you@email.com"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={profileLoading} className="btn-primary" style={{ fontSize: '12px', padding: '9px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {profileLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={13} strokeWidth={2.5} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Form 2: Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="card"
          style={cardStyle}
        >
          <div style={sectionHeaderStyle}>
            <div style={iconBoxStyle('linear-gradient(135deg, #f59e0b, #d97706)')}>
              <KeyRound size={15} strokeWidth={2.5} color="white" />
            </div>
            <span>Change Password</span>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="input-group">
              <label className="input-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                  }}
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {/* New Password */}
            <div className="input-group">
              <label className="input-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  placeholder="Minimum 8 characters"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                  }}
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {/* Confirm New Password */}
            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                  }}
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Password strength hint */}
            {passForm.newPassword && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: passForm.newPassword.length >= 8 ? 'rgba(52,211,153,0.08)' : 'rgba(251,146,60,0.08)',
                border: `1px solid ${passForm.newPassword.length >= 8 ? 'rgba(52,211,153,0.2)' : 'rgba(251,146,60,0.2)'}`,
              }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={13}
                    style={{ color: passForm.newPassword.length >= 8 ? '#34d399' : '#fb923c' }}
                  />
                  <span className="text-[11px] font-medium" style={{
                    color: passForm.newPassword.length >= 8 ? '#34d399' : '#fb923c'
                  }}>
                    {passForm.newPassword.length >= 8
                      ? 'Password meets the minimum length requirement'
                      : `${8 - passForm.newPassword.length} more character${8 - passForm.newPassword.length === 1 ? '' : 's'} needed`
                    }
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={passLoading} className="btn-primary" style={{ fontSize: '12px', padding: '9px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {passLoading ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                ) : (
                  <><Lock size={13} strokeWidth={2.5} /> Update Password</>
                )}
              </button>
            </div>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
