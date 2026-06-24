import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Shield, Mail, Phone, Lock, Calendar, CreditCard, MapPin, CheckCircle2, DollarSign } from 'lucide-react';
import { setUser } from '../../redux/slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Shimmer Skeleton ──
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="space-y-2">
          <div className="skeleton skeleton-title w-48" />
          <div className="skeleton skeleton-text w-64" />
        </div>
      </div>

      {/* Banner Skeleton */}
      <div className="card flex flex-col md:flex-row items-center gap-6">
        <div className="skeleton w-24 h-24 rounded-3xl shrink-0" />
        <div className="space-y-2 flex-1 text-center md:text-left">
          <div className="skeleton h-6 w-40 mx-auto md:mx-0" />
          <div className="skeleton h-4 w-60 mx-auto md:mx-0" />
          <div className="skeleton h-3.5 w-32 mx-auto md:mx-0" />
        </div>
        <div className="skeleton h-8 w-36 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column info cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card space-y-4">
            <div className="skeleton h-5 w-32 mb-2" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-1">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-28" />
              </div>
            ))}
          </div>
          <div className="card space-y-4">
            <div className="skeleton h-5 w-40 mb-2" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between py-1">
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <div className="skeleton h-5 w-44 mb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><div className="skeleton h-3 w-16" /><div className="skeleton h-10 w-full rounded-xl" /></div>
              <div className="space-y-2"><div className="skeleton h-3 w-24" /><div className="skeleton h-10 w-full rounded-xl" /></div>
            </div>
            <div className="flex justify-end"><div className="skeleton h-10 w-36 rounded-xl" /></div>
          </div>
          <div className="card space-y-4">
            <div className="skeleton h-5 w-32 mb-2" />
            <div className="space-y-2"><div className="skeleton h-3 w-28" /><div className="skeleton h-10 w-full rounded-xl" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><div className="skeleton h-3 w-24" /><div className="skeleton h-10 w-full rounded-xl" /></div>
              <div className="space-y-2"><div className="skeleton h-3 w-28" /><div className="skeleton h-10 w-full rounded-xl" /></div>
            </div>
            <div className="flex justify-end"><div className="skeleton h-10 w-36 rounded-xl" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit forms state
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/me');
      const data = response.data.data;
      setProfileData(data);
      setProfileForm({
        name: data.name || '',
        email: data.email || '',
      });
    } catch (e) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

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
        toast.success('Profile details updated!');
        fetchProfileDetails();
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
        setPassForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  const p = profileData || {};

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal settings and employee records</p>
        </div>
      </div>

      {/* Header Banner */}
      <div className="card relative overflow-hidden bg-slate-900 border-slate-800">
        <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {p.photo_url ? (
            <img src={p.photo_url} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-xl shadow-blue-500/25 shrink-0" />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-blue-500/25 shrink-0">
              {p.name?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div className="text-center md:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-2xl font-bold text-slate-100 leading-tight">{p.name || 'Admin User'}</h2>
              <span className="badge-blue text-xs font-semibold uppercase">{p.role}</span>
            </div>
            <p className="text-slate-400 font-medium text-sm flex items-center justify-center md:justify-start gap-1">
              <Shield className="w-4 h-4 text-blue-400" /> {p.designation || 'System Administrator'} · {p.department || 'Administration'}
            </p>
            <p className="text-slate-500 text-xs">Employee ID: <span className="font-mono text-blue-300">{p.employee_code || 'HPS-001'}</span></p>
          </div>
          <div className="md:ml-auto bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold">Authorized Profile</span>
          </div>
        </div>
      </div>

      {/* Profile Details and Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Full Employee Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card space-y-5">
            <h3 className="text-slate-200 font-semibold border-b border-slate-800 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> Personal Details
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Phone</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {p.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {p.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Joining Date</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> {p.joining_date ? new Date(p.joining_date).toLocaleDateString('en-IN') : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Basic Salary</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {p.salary ? `₹${parseFloat(p.salary).toLocaleString('en-IN')}/mo` : 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1 py-1">
                <span className="text-slate-400 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> Address</span>
                <span className="text-slate-300 text-xs leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800">{p.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="card space-y-5">
            <h3 className="text-slate-200 font-semibold border-b border-slate-800 pb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" /> Financial & Identification Records
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Bank Account</span>
                <span className="text-slate-200 font-mono font-medium">{p.bank_account || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">IFSC Code</span>
                <span className="text-slate-200 font-mono font-medium">{p.ifsc_code || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">PAN Number</span>
                <span className="text-slate-200 font-mono font-medium">{p.pan_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Emergency Contact</span>
                <span className="text-slate-200 font-medium">{p.emergency_contact || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Edit Account Details and Change Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form */}
          <div className="card">
            <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> Edit Account Details
            </h3>
            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  className="input"
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter full name"
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
                  placeholder="Enter email address"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 flex justify-end mt-2">
                <button type="submit" disabled={profileLoading} className="btn-primary w-full sm:w-auto">
                  {profileLoading ? 'Updating Account...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="card">
            <h3 className="text-slate-200 font-semibold mb-5 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" /> Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <input
                  className="input"
                  type="password"
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  placeholder="Verify your current password"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    className="input"
                    type="password"
                    required
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <input
                    className="input"
                    type="password"
                    required
                    value={passForm.confirmPassword}
                    onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={passLoading} className="btn-primary w-full sm:w-auto">
                  {passLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
