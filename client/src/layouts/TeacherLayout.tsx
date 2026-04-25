import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Mic,
  FileText,
  Users,
  ClipboardCheck,
  MessageCircleQuestion,
  BarChart3,
  CalendarDays,
  FolderOpen,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Zap,
  Radio,
  Search,
  Wifi
} from 'lucide-react'

const navItems = [
  { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/teacher/record', icon: Radio, label: 'Live Lecture' },
  { to: '/teacher/notes', icon: FileText, label: 'Notes Studio' },
  { to: '/teacher/students', icon: Users, label: 'Students' },
  { to: '/teacher/assessments', icon: ClipboardCheck, label: 'Assessments' },
  { to: '/teacher/doubts', icon: MessageCircleQuestion, label: 'Doubts & Queries', badge: 3 },
  { to: '/teacher/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/teacher/planner', icon: CalendarDays, label: 'Planner' },
  { to: '/teacher/resources', icon: FolderOpen, label: 'Resources' },
  { to: '/teacher/settings', icon: Settings, label: 'Settings' },
]

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/teacher': { title: 'Dashboard', subtitle: 'AI-powered teaching command center' },
  '/teacher/record': { title: 'Live Lecture', subtitle: 'Record, transcribe, and process in real-time' },
  '/teacher/notes': { title: 'Notes Studio', subtitle: 'Refine, translate, and publish learning content' },
  '/teacher/students': { title: 'Students', subtitle: 'Monitor engagement and academic performance' },
  '/teacher/assessments': { title: 'Assessments', subtitle: 'Quizzes, flashcards, and evaluation tools' },
  '/teacher/doubts': { title: 'Doubts & Queries', subtitle: 'Review and respond to student questions' },
  '/teacher/analytics': { title: 'Analytics', subtitle: 'Content effectiveness and learning insights' },
  '/teacher/planner': { title: 'Planner', subtitle: 'Schedule lectures and manage deadlines' },
  '/teacher/resources': { title: 'Resources', subtitle: 'Teaching materials and file management' },
  '/teacher/settings': { title: 'Settings', subtitle: 'Configure workspace and preferences' },
}

export default function TeacherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showClassSwitch, setShowClassSwitch] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const currentPage = pageTitles[location.pathname] || pageTitles['/teacher']

  return (
    <div className="min-h-screen flex bg-[#0A0F1F]">
      {/* ── Left Sidebar ── */}
      <aside className="w-[280px] fixed h-screen z-30 flex flex-col border-r"
        style={{
          background: 'rgba(17,24,39,0.92)',
          backdropFilter: 'blur(24px)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}>

        {/* Brand */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              E
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">Exceed</h1>
              <p className="text-xs text-gray-500 font-medium tracking-widest uppercase">Teacher Workspace</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-blue-300 font-medium">CS-301 Active</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <Icon size={18} className="relative z-10 flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                    <span className="relative z-10 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="relative z-10 ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Profile */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 truncate">Computer Science</p>
            </div>
            <div className="flex items-center gap-1">
              <Wifi size={12} className="text-emerald-400" />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-400 rounded-lg transition-colors hover:bg-red-500/5"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 ml-[280px] min-h-screen">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(10,15,31,0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
          <div>
            <h1 className="text-xl font-semibold text-white">{currentPage.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{currentPage.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 transition-colors hover:bg-white/[0.04]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={15} />
              <span className="hidden lg:inline">Search...</span>
              <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-600 ml-4 font-mono">/</kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg transition-colors hover:bg-white/[0.04]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <Bell size={17} className="text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
              </button>
            </div>

            {/* Class Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowClassSwitch(!showClassSwitch)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 font-medium transition-colors hover:bg-white/[0.04]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <span>CS-301</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
            </div>

            {/* Start Lecture CTA */}
            <button
              onClick={() => navigate('/teacher/record')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
              }}>
              <Zap size={15} />
              <span>Start Lecture</span>
            </button>

            {/* Mini Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
