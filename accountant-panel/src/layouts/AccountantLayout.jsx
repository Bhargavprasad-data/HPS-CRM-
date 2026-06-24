import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import {
  LayoutDashboard, IndianRupee, FileText, Receipt,
  BarChart3, LogOut, Menu, X, ChevronRight,
  Sun, Moon, User, Bell, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const NAV = [
  { path: '/dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
  { path: '/payroll',     label: 'Payroll Suite',      icon: IndianRupee     },
  { path: '/quotations',  label: 'Quotations',         icon: FileText        },
  { path: '/invoices',    label: 'Invoices Log',       icon: Receipt         },
  { path: '/reports',     label: 'Financial Reports',  icon: BarChart3       },
];

/* ── Framer-motion variants ──────────────────────────────────── */
const sidebarVariants = {
  collapsed: { width: 64,  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  expanded:  { width: 256, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

const labelVariants = {
  hidden: { opacity: 0, x: -8, transition: { duration: 0.1 } },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.18, delay: 0.08 } },
};

const mobileDrawerVariants = {
  hidden: { x: '-100%', transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  show:   { x: '0%',   transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

/* ── SidebarContent ──────────────────────────────────────────── */
function SidebarContent({ expanded, mobile = false, onClose, handleLogout, user }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full select-none overflow-hidden">
      {/* Logo */}
      <div
        className="flex items-center gap-3 border-b border-[var(--border-sidebar)] shrink-0"
        style={{ height: 64, paddingLeft: 16, paddingRight: 12 }}
      >
        <img src="/hps_logo.png" alt="HPS Logo" className="w-8 h-8 object-contain shrink-0" />
        <AnimatePresence>
          {(expanded || mobile) && (
            <motion.div
              key="logo-text"
              variants={labelVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="min-w-0 flex flex-col justify-center"
            >
              <span className="text-amber-400 font-extrabold text-sm leading-none tracking-wider">HPS</span>
              <p className="text-[var(--text-secondary)] text-[8px] uppercase tracking-widest font-bold mt-1 leading-none">
                HARSHA PERFECT SOLUTIONS
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {mobile && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon   = item.icon;
          const active = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => mobile && onClose?.()}
              title={!expanded && !mobile ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer relative overflow-hidden ${
                active
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-full" />
              )}
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <AnimatePresence>
                {(expanded || mobile) && (
                  <motion.span
                    key={`label-${item.path}`}
                    variants={labelVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="p-2 border-t border-[var(--border-sidebar)] shrink-0">
        <Link
          to="/profile"
          onClick={() => mobile && onClose?.()}
          className={`flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-input)] transition-all duration-200 group ${!expanded && !mobile ? 'justify-center' : ''}`}
          title="View Profile"
        >
          {user?.photo_url || user?.photo ? (
            <img
              src={user.photo_url || user.photo}
              alt="Profile"
              className="w-8 h-8 rounded-xl object-cover shadow-md shrink-0 ring-2 ring-amber-500/0 group-hover:ring-amber-500/40 transition-all"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ring-2 ring-amber-500/0 group-hover:ring-amber-500/40 transition-all">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <AnimatePresence>
            {(expanded || mobile) && (
              <motion.div
                key="profile-text"
                variants={labelVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="flex-1 min-w-0"
              >
                <p className="text-[var(--text-primary)] text-xs font-semibold truncate leading-tight">{user?.name || 'Accountant'}</p>
                <p className="text-amber-400 text-[10px] truncate mt-0.5">View Profile →</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {(expanded || mobile) && (
              <motion.button
                key="logout-btn"
                variants={labelVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }}
                className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 transition-colors z-10"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </div>
  );
}

/* ── AccountantLayout ────────────────────────────────────────── */
export default function AccountantLayout({ children }) {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useSelector((s) => s.auth);

  const [hovered,    setHovered]    = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme,      setTheme]      = useState(() => localStorage.getItem('hps_acc_theme') || 'dark');

  /* Notifications */
  const [notifications,    setNotifications]    = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount,      setUnreadCount]      = useState(0);
  const notifRef = useRef(null);

  /* Theme persistence */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') { root.classList.add('light');  root.classList.remove('dark'); }
    else                   { root.classList.add('dark');   root.classList.remove('light'); }
    localStorage.setItem('hps_acc_theme', theme);
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

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">

      {/* ── Desktop Sidebar — fixed w-16 anchor, overlay expands on hover ── */}
      <div className="hidden lg:block shrink-0 w-16 relative z-30">
        <motion.div
          className="fixed top-0 left-0 h-screen flex flex-col z-30 shadow-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-sidebar-solid)',
            borderRight: '1px solid var(--border-sidebar)',
          }}
          variants={sidebarVariants}
          initial="collapsed"
          animate={hovered ? 'expanded' : 'collapsed'}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <SidebarContent
            expanded={hovered}
            handleLogout={handleLogout}
            user={user}
          />
        </motion.div>
      </div>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="mobile-drawer"
              variants={mobileDrawerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="lg:hidden fixed top-0 left-0 h-screen w-72 z-50 flex flex-col shadow-2xl"
              style={{
                backgroundColor: 'var(--bg-sidebar-solid)',
                borderRight: '1px solid var(--border-sidebar)',
              }}
            >
              <SidebarContent
                expanded
                mobile
                onClose={() => setMobileOpen(false)}
                handleLogout={handleLogout}
                user={user}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header
          className="h-16 border-b flex items-center px-4 gap-3 shrink-0 z-20 backdrop-blur-xl"
          style={{ background: 'var(--bg-header)', borderColor: 'var(--border-header)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-semibold">
              {currentNav?.label || 'Accountant Portal'}
            </span>
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
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
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
                              ? '1px solid rgba(245,158,11,0.15)'
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
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Role badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl select-none">
            <div className="w-2 h-2 rounded-full bg-amber-400 dot-pulse" />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Accountant</span>
          </div>

          {/* Header Avatar */}
          <Link to="/profile" title="My Profile" className="shrink-0">
            {user?.photo_url || user?.photo ? (
              <img
                src={user.photo_url || user.photo}
                alt="Profile"
                className="w-8 h-8 rounded-xl object-cover shadow-md cursor-pointer select-none ring-2 ring-amber-500/0 hover:ring-amber-500/40 transition-all"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer select-none ring-2 ring-amber-500/0 hover:ring-amber-500/40 transition-all">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
