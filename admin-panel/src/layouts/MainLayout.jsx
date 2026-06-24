import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../redux/slices/authSlice';
import {
  LayoutDashboard, Users, Clock, IndianRupee, UserCheck, FolderKanban,
  Ticket, FileText, Receipt, Mail, BarChart3, Settings, LogOut,
  ChevronRight, Bell, Search, Moon, Sun, Menu, X,
  Shield, CreditCard, ChevronDown, User, Command,
  Sparkles, Activity, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ─────────────────────────────────────────────────
   NAV DEFINITION
───────────────────────────────────────────────── */
const NAV_ITEMS = [
  { section: 'Overview' },
  { path: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { section: 'Human Resources' },
  { path: '/employees',     label: 'Employees',    icon: Users },
  { path: '/attendance',    label: 'Attendance',   icon: Clock },
  { path: '/payroll',       label: 'Payroll',      icon: IndianRupee },
  { section: 'CRM' },
  { path: '/customers',     label: 'Customers',    icon: UserCheck },
  { path: '/projects',      label: 'Projects',     icon: FolderKanban },
  { path: '/tickets',       label: 'Tickets',      icon: Ticket },
  { section: 'Finance' },
  { path: '/quotations',    label: 'Quotations',   icon: FileText },
  { path: '/invoices',      label: 'Invoices',     icon: Receipt },
  { section: 'Documents' },
  { path: '/offer-letters', label: 'Offer Letters',icon: Mail },
  { path: '/id-cards',      label: 'ID Cards',     icon: CreditCard },
  { section: 'Analytics' },
  { path: '/reports',       label: 'Reports',      icon: BarChart3 },
  { path: '/settings',      label: 'Settings',     icon: Settings },
];

/* ─────────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────────── */
// Smooth spring that feels like Jio/Hotstar sidebar
const SIDEBAR_SPRING = {
  type: 'spring',
  stiffness: 360,
  damping: 34,
  mass: 0.88,
};

const labelVariants = {
  hidden: { opacity: 0, x: -10, transition: { duration: 0.1 } },
  show:   { opacity: 1, x: 0,   transition: { duration: 0.16, delay: 0.06 } },
};

const sectionVariants = {
  hidden: { opacity: 0, transition: { duration: 0.08 } },
  show:   { opacity: 1, transition: { duration: 0.18, delay: 0.1 } },
};

const drawerVariants = {
  hidden: { x: '-100%', transition: { type: 'spring', stiffness: 400, damping: 38 } },
  show:   { x: '0%',   transition: { type: 'spring', stiffness: 380, damping: 36 } },
};

/* ─────────────────────────────────────────────────
   TOOLTIP (collapsed icon-rail only)
───────────────────────────────────────────────── */
function SidebarTooltip({ label, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -6, scale: 0.9 }}
          animate={{ opacity: 1, x: 0,  scale: 1 }}
          exit={  { opacity: 0, x: -4, scale: 0.94 }}
          transition={{ duration: 0.13 }}
          className="sidebar-tooltip"
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────
   SINGLE NAV ITEM
───────────────────────────────────────────────── */
function NavItem({ item, expanded, mobile, onClose }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const Icon = item.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => !expanded && !mobile && setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <NavLink
        to={item.path}
        onClick={() => { onClose?.(); setTooltipVisible(false); }}
        className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        style={{
          paddingLeft: expanded || mobile ? 16 : 20,
          justifyContent: expanded || mobile ? 'flex-start' : 'center',
        }}
      >
        <Icon className="sidebar-icon shrink-0" size={17} strokeWidth={1.8} />
        <AnimatePresence>
          {(expanded || mobile) && (
            <motion.span
              key="label"
              variants={labelVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="truncate overflow-hidden"
              style={{ whiteSpace: 'nowrap' }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </NavLink>
      {!expanded && !mobile && (
        <SidebarTooltip label={item.label} visible={tooltipVisible} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   SIDEBAR INNER CONTENT
───────────────────────────────────────────────── */
function SidebarContent({ expanded, mobile, onClose, user, handleLogout }) {
  return (
    <div className="flex flex-col h-full select-none overflow-hidden">

      {/* ── Logo ── */}
      <div
        className="flex items-center shrink-0 overflow-hidden"
        style={{
          height: 56,
          borderBottom: '1px solid var(--border-sidebar)',
          paddingLeft: expanded || mobile ? 16 : 0,
          justifyContent: expanded || mobile ? 'flex-start' : 'center',
          gap: expanded || mobile ? 10 : 0,
          transition: 'padding 0.2s, gap 0.2s',
        }}
      >
        {/* Logo image */}
        <div className="relative shrink-0">
          <img
            src="/logo.png"
            alt="HPS"
            className="w-8 h-8 object-contain shrink-0"
            onError={(e) => { e.target.src = '/hps_logo.png'; }}
          />
        </div>

        <AnimatePresence>
          {(expanded || mobile) && (
            <motion.div
              key="logo-text"
              variants={labelVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="min-w-0 overflow-hidden"
            >
              <p
                className="font-extrabold text-sm leading-none tracking-wide"
                style={{ color: 'var(--sidebar-active-color)' }}
              >
                HPS
              </p>
              <p
                className="text-[9px] font-semibold uppercase tracking-widest mt-0.5 whitespace-nowrap"
                style={{ color: 'var(--text-muted)' }}
              >
                Harsha Perfect Solutions
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-hidden space-y-0.5">
        {NAV_ITEMS.map((item, idx) => {
          if (item.section) {
            if (!expanded && !mobile) {
              // Divider line when collapsed
              return (
                <div
                  key={idx}
                  className="my-3 mx-3"
                  style={{ borderTop: '1px solid var(--border-sidebar)' }}
                />
              );
            }
            return (
              <AnimatePresence key={idx}>
                {(expanded || mobile) && (
                  <motion.p
                    variants={sectionVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="sidebar-section"
                  >
                    {item.section}
                  </motion.p>
                )}
              </AnimatePresence>
            );
          }
          return (
            <NavItem
              key={item.path}
              item={item}
              expanded={expanded}
              mobile={mobile}
              onClose={onClose}
            />
          );
        })}
      </nav>

      {/* ── User profile footer ── */}
      <div
        className="shrink-0 p-2"
        style={{ borderTop: '1px solid var(--border-sidebar)' }}
      >
        <AnimatePresence>
          {(expanded || mobile) ? (
            <motion.div
              key="user-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Link
                to="/profile"
                onClick={() => mobile && onClose?.()}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 group"
                style={{ background: 'var(--bg-sidebar-item-hover)' }}
              >
                {user?.photo ? (
                  <img
                    src={user.photo}
                    alt="Profile"
                    className="w-7 h-7 rounded-lg object-cover shrink-0 ring-2 ring-indigo-500/0 group-hover:ring-indigo-500/40 transition-all"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
                  >
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold truncate leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {user?.email || 'admin@hps.com'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); }}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                  title="Log out"
                >
                  <LogOut size={13} strokeWidth={2} />
                </button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="user-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex justify-center"
            >
              <Link to="/profile" title="My Profile">
                {user?.photo ? (
                  <img
                    src={user.photo}
                    alt="Profile"
                    className="w-8 h-8 rounded-lg object-cover hover:ring-2 hover:ring-indigo-500/40 transition-all"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[11px] hover:opacity-80 transition-all"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
                  >
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   MAIN LAYOUT
───────────────────────────────────────────────── */
export default function MainLayout({ children }) {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useSelector((s) => s.auth);

  /* Theme */
  const [theme, setTheme] = useState(
    () => localStorage.getItem('hps_theme') || 'dark'
  );

  /* Sidebar */
  const [sidebarExpanded,  setSidebarExpanded]  = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const leaveTimer = useRef(null);

  /* Notifications */
  const [notifications,    setNotifications]    = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount,      setUnreadCount]      = useState(0);
  const notifRef   = useRef(null);

  /* User menu */
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef  = useRef(null);

  /* Search */
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const searchRef = useRef(null);

  /* ── Theme ── */
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('hps_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    toast.success(`${next === 'light' ? 'Light' : 'Dark'} mode`, {
      duration: 1500,
      icon: next === 'light' ? '☀️' : '🌙',
    });
  }, [theme]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  /* ── Outside click ── */
  useEffect(() => {
    const fn = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* ── Close mobile on route change ── */
  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  /* ── Fetch notifications ── */
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
  };

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

  /* ── Logout ── */
  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  }, [dispatch, navigate]);

  /* ── Sidebar hover handlers (snappy enter, slight debounce on leave) ── */
  const handleSidebarEnter = useCallback(() => {
    clearTimeout(leaveTimer.current);
    setSidebarExpanded(true);
  }, []);

  const handleSidebarLeave = useCallback(() => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setSidebarExpanded(false), 90);
  }, []);

  /* current page label for breadcrumb */
  const currentPage = NAV_ITEMS.find(
    (n) => n.path && location.pathname.startsWith(n.path)
  )?.label || 'Dashboard';

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-main)' }}
    >
      {/* ══════════════════════════════════════════════
          DESKTOP SIDEBAR — fixed 64px anchor, overlay expands
          Main content NEVER shifts on expand/collapse
          ══════════════════════════════════════════════ */}
      <div
        className="hidden lg:block shrink-0 relative z-40"
        style={{ width: 64 }}
      >
        <motion.div
          className="fixed top-0 left-0 h-screen z-40 flex flex-col overflow-hidden"
          onMouseEnter={handleSidebarEnter}
          onMouseLeave={handleSidebarLeave}
          animate={{ width: sidebarExpanded ? 256 : 64 }}
          transition={SIDEBAR_SPRING}
          style={{
            backgroundColor: 'var(--bg-sidebar-solid)',
            borderRight: '1px solid var(--border-sidebar)',
            boxShadow: sidebarExpanded
              ? '4px 0 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
              : 'none',
          }}
        >
          <SidebarContent
            expanded={sidebarExpanded}
            mobile={false}
            onClose={() => {}}
            user={user}
            handleLogout={handleLogout}
          />
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE SIDEBAR — full drawer with backdrop blur
          ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="lg:hidden fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="lg:hidden fixed top-0 left-0 h-screen z-50 flex flex-col"
              style={{
                width: 270,
                backgroundColor: 'var(--bg-sidebar-solid)',
                borderRight: '1px solid var(--border-sidebar)',
                boxShadow: '8px 0 48px rgba(0,0,0,0.6)',
              }}
            >
              {/* Close btn */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-3.5 right-3 z-10 btn-ghost btn-icon-sm"
                aria-label="Close sidebar"
              >
                <X size={15} strokeWidth={2} />
              </button>
              <SidebarContent
                expanded={true}
                mobile={true}
                onClose={() => setMobileSidebarOpen(false)}
                user={user}
                handleLogout={handleLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT AREA
          ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── HEADER ── */}
        <header
          className="shrink-0 flex items-center px-4 gap-2.5"
          style={{
            height: 56,
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border-header)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 30,
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="btn-ghost btn-icon lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={17} strokeWidth={2} />
          </button>

          {/* Desktop menu icon */}
          <button
            onClick={() => setSidebarExpanded((v) => !v)}
            className="btn-ghost btn-icon hidden lg:flex"
            aria-label="Toggle sidebar pin"
          >
            <Menu size={17} strokeWidth={2} />
          </button>

          {/* Breadcrumb */}
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <Shield size={12} strokeWidth={2} className="text-indigo-400" />
            <ChevronRight size={11} className="opacity-35" />
            <motion.span
              key={currentPage}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="font-semibold text-[13px]"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentPage}
            </motion.span>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative hidden md:block">
            <Search
              size={12}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <motion.input
              ref={searchRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              animate={{ width: searchFocused ? 260 : 180 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="rounded-xl pl-8 pr-14 py-2 text-xs outline-none"
              style={{
                background: 'var(--bg-input)',
                border: `1px solid ${searchFocused ? 'var(--border-input-focus)' : 'var(--border-input)'}`,
                color: 'var(--text-primary)',
                boxShadow: searchFocused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
            <kbd
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold pointer-events-none"
              style={{
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-input)',
                color: 'var(--text-muted)',
              }}
            >
              <Command size={8} />K
            </kbd>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost btn-icon"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            <motion.div
              animate={{ rotate: theme === 'dark' ? 0 : 180, scale: 1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              {theme === 'dark' ? (
                <Sun size={16} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <Moon size={16} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              )}
            </motion.div>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="btn-ghost btn-icon relative"
              aria-label="Notifications"
            >
              <Bell size={16} strokeWidth={1.75} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8.5px] flex items-center justify-center font-bold"
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
                  className="absolute right-0 w-80 rounded-2xl p-4"
                  style={{
                    top: 'calc(100% + 8px)',
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
                      <Bell size={13} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                      <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        Notifications
                      </h3>
                    </div>
                    <div className="flex gap-2.5">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
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
                        <Activity
                          size={28}
                          strokeWidth={1.25}
                          className="mx-auto mb-2 opacity-20"
                          style={{ color: 'var(--text-muted)' }}
                        />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="p-3 rounded-xl text-xs transition-colors cursor-pointer"
                          style={{
                            background: !n.is_read ? 'var(--bg-active)' : 'var(--bg-hover)',
                            border: !n.is_read
                              ? '1px solid rgba(99,102,241,0.14)'
                              : '1px solid transparent',
                          }}
                        >
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {n.title}
                          </p>
                          <p className="mt-0.5" style={{ color: 'var(--text-muted)' }}>
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

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-150"
              style={{
                background: showUserMenu ? 'var(--bg-hover)' : 'transparent',
                border: '1px solid transparent',
              }}
            >
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt="Profile"
                  className="w-7 h-7 rounded-lg object-cover shadow-md shrink-0"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p
                  className="text-[12px] font-semibold leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {user?.name || 'Admin'}
                </p>
              </div>
              <motion.div
                animate={{ rotate: showUserMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:block"
              >
                <ChevronDown size={11} style={{ color: 'var(--text-muted)' }} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  key="user-menu"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.17, ease: 'easeOut' }}
                  className="absolute right-0 w-58 rounded-2xl py-2 overflow-hidden"
                  style={{
                    top: 'calc(100% + 8px)',
                    width: 220,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 50,
                  }}
                >
                  {/* User info block */}
                  <div
                    className="px-3 py-3 mb-1"
                    style={{ borderBottom: '1px solid var(--border-card)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
                      >
                        {user?.name?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {user?.name || 'Admin'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          />
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Super Admin
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    { label: 'My Profile', icon: User,     path: '/profile' },
                    { label: 'Settings',   icon: Settings, path: '/settings' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { setShowUserMenu(false); navigate(item.path); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <item.icon size={13} strokeWidth={2} />
                      {item.label}
                    </button>
                  ))}

                  <div
                    className="my-1.5 mx-3"
                    style={{ borderTop: '1px solid var(--border-card)' }}
                  />

                  <button
                    onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-red-400 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={13} strokeWidth={2} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6 scrollbar-thin">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
