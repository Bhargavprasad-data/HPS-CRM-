import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, Calendar, FileText, Ticket,
  LogOut, Building2, Menu, X, ChevronRight, Bell, Activity,
  Sun, Moon
} from 'lucide-react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import api from '../services/api';

const NAV = [
  { path: '/dashboard',  label: 'Dashboard',      icon: Clock },
  { path: '/attendance', label: 'Attendance',      icon: Clock           },
  { path: '/leaves',     label: 'Leave Requests',  icon: Calendar        },
  { path: '/projects',   label: 'My Projects',     icon: Building2       },
  { path: '/tickets',    label: 'Support Tickets', icon: Ticket          },
  { path: '/payslips',   label: 'Salary Slips',    icon: FileText        },
];

/* ────────────────────────────────────────────────────────────── */
/*  CheckIn Widget                                                */
/* ────────────────────────────────────────────────────────────── */
function CheckInWidget({ onClockChange }) {
  const [status, setStatus] = useState({
    checked_in: false, checked_out: false,
    check_in_time: null, check_out_time: null,
  });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/attendance?date=today&limit=1');
      const today = res.data.data?.find(
        (a) => new Date(a.date).toDateString() === new Date().toDateString()
      );
      if (today) {
        setStatus({
          checked_in:     !!today.check_in && !today.check_out,
          checked_out:    !!today.check_out,
          check_in_time:  today.check_in,
          check_out_time: today.check_out,
        });
      } else {
        setStatus({ checked_in: false, checked_out: false, check_in_time: null, check_out_time: null });
      }
    } catch {}
  };

  useEffect(() => { fetchStatus(); }, []);

  const checkIn = async () => {
    setLoading(true);
    try {
      await api.post('/attendance/checkin');
      toast.success('Checked in! Have a productive day 🚀');
      await fetchStatus();
      if (onClockChange) onClockChange();
    } catch (e) { toast.error(e.response?.data?.message || 'Check-in failed'); }
    finally { setLoading(false); }
  };

  const checkOut = async () => {
    setLoading(true);
    try {
      await api.post('/attendance/checkout');
      toast.success('Checked out! See you tomorrow 👋');
      await fetchStatus();
      if (onClockChange) onClockChange();
    } catch (e) { toast.error(e.response?.data?.message || 'Check-out failed'); }
    finally { setLoading(false); }
  };

  const isActive = status.checked_in;
  const isDone   = status.checked_out;

  return (
    <div className={`card-glass flex items-center gap-4 relative overflow-hidden border ${
      isActive ? 'border-emerald-500/20' : isDone ? 'border-red-500/15' : 'border-[var(--border-card-glass)]'
    }`}>
      <div className={`absolute -top-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isActive ? 'bg-emerald-500' : isDone ? 'bg-red-500' : 'bg-violet-600'
      }`} />

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative border ${
        isActive ? 'bg-emerald-500/10 border-emerald-500/25' :
        isDone   ? 'bg-red-500/10 border-red-500/20'         :
                   'bg-[var(--bg-input)] border-[var(--border-input)]'
      }`}>
        <Clock className={`w-6 h-6 ${isActive ? 'text-emerald-400' : isDone ? 'text-red-400' : 'text-slate-500'}`} />
        {isActive && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[var(--bg-card)] dot-pulse" />}
        {isDone   && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-400 border-2 border-[var(--bg-card)]" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[var(--text-secondary)] text-xs font-medium">Today's Attendance</p>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${
            isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'  :
            isDone   ? 'bg-red-500/10 border-red-500/20 text-red-400'              :
                       'bg-[var(--bg-hover)] border-[var(--border-input)] text-[var(--text-secondary)]'
          }`}>
            {isActive ? 'Active' : isDone ? 'Complete' : 'Not Clocked'}
          </span>
        </div>
        <p className="text-[var(--text-primary)] font-semibold text-sm">
          {isActive ? `In at ${status.check_in_time}` :
           isDone   ? `Out at ${status.check_out_time}` : 'Not checked in yet'}
        </p>
        <p className="text-[var(--text-secondary)] text-xs mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <button
        onClick={isActive ? checkOut : checkIn}
        disabled={loading || isDone}
        className={`shrink-0 flex items-center gap-2 ${
          isActive ? 'btn-danger' : isDone ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-success'
        }`}
      >
        {loading
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />
        }
        <span>{isActive ? 'Check Out' : isDone ? 'Clocked Out' : 'Check In'}</span>
      </button>
    </div>
  );
}

export { CheckInWidget };

/* ────────────────────────────────────────────────────────────── */
/*  StaffLayout — Hover sidebar (Accountant Panel style)          */
/* ────────────────────────────────────────────────────────────── */
export default function StaffLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);

  const [hovered,    setHovered]    = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme,      setTheme]      = useState(() => localStorage.getItem('hps_staff_theme') || 'dark');

  /* Notifications */
  const [notifications,    setNotifications]    = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount,      setUnreadCount]      = useState(0);
  const notifRef = useRef(null);

  /* Theme persistence */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') { root.classList.add('light'); root.classList.remove('dark'); }
    else                   { root.classList.add('dark');  root.classList.remove('light'); }
    localStorage.setItem('hps_staff_theme', theme);
  }, [theme]);

  /* Outside click for notifications dropdown */
  useEffect(() => {
    const fn = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* Fetch notifications */
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (n) => {
    try {
      if (!n.is_read) {
        await api.put(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setShowNotifications(false);
      if (n.link) {
        navigate(n.link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  /* Close mobile on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out. See you soon!');
    navigate('/login');
  };

  const currentNav = NAV.find((n) => location.pathname.startsWith(n.path));

  const SidebarContent = ({ mobile = false }) => {
    const activeExpanded = hovered || mobile;
    return (
      <div 
        className="flex flex-col h-full select-none"
        onMouseEnter={() => !mobile && setHovered(true)}
        onMouseLeave={() => !mobile && setHovered(false)}
      >
        {/* Header Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border-sidebar)] h-16 shrink-0">
          <img src="/hps_logo.png" className="w-8 h-8 object-contain shrink-0" alt="HPS Logo" />
          {activeExpanded && (
            <div className="min-w-0 transition-opacity duration-300 animate-fade-in flex flex-col justify-center">
              <span className="text-blue-500 dark:text-blue-400 font-extrabold text-base leading-none tracking-wider">HPS</span>
              <p className="text-slate-800 dark:text-white text-[7px] uppercase tracking-wider font-bold mt-1.5 leading-none">
                HARSHA PERFECT SOLUTIONS
              </p>
            </div>
          )}
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                onClick={() => mobile && setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {activeExpanded && <span className="truncate transition-opacity duration-300 animate-fade-in">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile User Info */}
        <div className="p-3 border-t border-[var(--border-sidebar)] shrink-0">
          <Link
            to="/profile"
            onClick={() => mobile && setMobileOpen(false)}
            className={`flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-input)] transition-all duration-200 group ${!activeExpanded ? 'justify-center' : ''}`}
            title="View Profile"
          >
            {user?.photo ? (
              <img src={user.photo} alt="Profile" className="w-8 h-8 rounded-xl object-cover shadow-md shrink-0 ring-2 ring-violet-500/0 group-hover:ring-violet-500/40 transition-all" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ring-2 ring-violet-500/0 group-hover:ring-violet-500/40 transition-all">
                {user?.name?.[0]?.toUpperCase() || 'S'}
              </div>
            )}
            {activeExpanded && (
              <div className="flex-1 min-w-0 transition-opacity duration-300 animate-fade-in">
                <p className="text-[var(--text-primary)] text-xs font-semibold truncate leading-tight">{user?.name || 'Staff'}</p>
                <p className="text-violet-400 text-[10px] truncate mt-0.5">View Profile →</p>
              </div>
            )}
            {activeExpanded && (
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }} 
                className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
      
      {/* Desktop Sidebar Layout anchor */}
      <div 
        className="hidden lg:block shrink-0 transition-all duration-300 ease-in-out border-r border-[var(--border-sidebar)] relative z-30 w-16"
      >
        <div 
          className={`fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] flex flex-col z-30 shadow-2xl ${
            hovered 
              ? 'w-64 backdrop-blur-md bg-[var(--bg-sidebar)]/95 ring-1 ring-black/10' 
              : 'w-16'
          }`}
        >
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] h-full flex flex-col animate-fade-in-left">
            <div className="absolute top-4 right-4 z-20">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Viewport content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-[var(--bg-header)] border-b border-[var(--border-header)] backdrop-blur-xl flex items-center px-4 gap-3 shrink-0 z-20">
          
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Path */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--text-primary)] font-semibold">{currentNav?.label || 'Staff Portal'}</span>
          </div>

          <div className="flex-1" />

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8.5px] flex items-center justify-center font-bold"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  key="notif"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.17, ease: 'easeOut' }}
                  className="absolute right-0 w-80 rounded-2xl p-4 mt-2"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 50,
                  }}
                >
                  <div
                    className="flex items-center justify-between mb-3 pb-2.5"
                    style={{ borderBottom: '1px solid var(--border-card)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <h3 className="font-bold text-sm text-[var(--text-primary)]">
                        Notifications
                      </h3>
                    </div>
                    <div className="flex gap-2.5">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-violet-400 hover:text-violet-300 font-medium transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleClearAll}
                          className="text-[10px] text-red-400 hover:text-red-300 font-medium transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="w-7 h-7 mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                        <p className="text-sm text-[var(--text-muted)]">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="p-3 rounded-xl text-xs transition-colors cursor-pointer text-left"
                          style={{
                            background: !n.is_read ? 'var(--bg-hover)' : 'transparent',
                            border: !n.is_read
                              ? '1px solid rgba(139,92,246,0.15)'
                              : '1px solid var(--border-input)',
                          }}
                        >
                          <p className="font-semibold text-[var(--text-primary)]">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-[var(--text-secondary)]">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2.5 rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light'
              ? <Moon className="w-4 h-4" />
              : <Sun  className="w-4 h-4 text-amber-400" />
            }
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl select-none">
            <div className="w-2 h-2 rounded-full bg-violet-400 dot-pulse" />
            <span className="text-violet-400 text-xs font-bold uppercase tracking-wider">Staff</span>
          </div>

          {user?.photo ? (
            <Link to="/profile" title="My Profile" className="shrink-0">
              <img src={user.photo} alt="Profile" className="w-8 h-8 rounded-xl object-cover shadow-md cursor-pointer select-none animate-fade-in ring-2 ring-violet-500/0 hover:ring-violet-500/40 transition-all" />
            </Link>
          ) : (
            <Link to="/profile" title="My Profile" className="shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer select-none ring-2 ring-violet-500/0 hover:ring-violet-500/40 transition-all">
                {user?.name?.[0]?.toUpperCase() || 'S'}
              </div>
            </Link>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in-up">{children}</main>
      </div>
    </div>
  );
}
