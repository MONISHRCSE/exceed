import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { progressAPI } from '../../api'
import {
  Users,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Eye,
  BookOpen,
  Award,
  Target,
  Clock,
  ArrowUpDown,
  BarChart2,
  MessageCircle,
  Zap
} from 'lucide-react'

export default function StudentMonitor() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'xp' | 'quiz' | 'name'>('xp')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    progressAPI.getStudents().then(setStudents).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const sorted = [...students]
    .filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'xp') return (b.total_xp || 0) - (a.total_xp || 0)
      if (sortBy === 'quiz') return (b.average_quiz_score || 0) - (a.average_quiz_score || 0)
      return (a.first_name || '').localeCompare(b.first_name || '')
    })

  const totalStudents = students.length
  const atRisk = students.filter(s => (s.total_xp || 0) < 50 && (s.average_quiz_score || 0) < 40).length
  const active = totalStudents - atRisk

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-[90px] shimmer rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-[200px] shimmer rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: totalStudents, icon: Users, color: '#3B82F6', sub: 'enrolled' },
          { label: 'Active Learners', value: active, icon: CheckCircle2, color: '#10B981', sub: 'on track' },
          { label: 'Needs Attention', value: atRisk, icon: AlertTriangle, color: '#EF4444', sub: 'low engagement' },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: `${card.color}12` }}>
                  <Icon size={18} style={{ color: card.color }} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">{card.value}</p>
                  <p className="text-sm text-gray-">{card.label} <span className="text-gray-600">/ {card.sub}</span></p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg text-sm text-gray- placeholder-gray-600 bg-white/[0.04] border transition-colors focus:outline-none focus:border-blue-500/40"
              style={{ borderColor: 'rgba(255,255,255,0.08)', width: '200px' }}
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {(['xp', 'quiz', 'name'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-gray-400 font-medium transition-all"
                style={{
                  color: sortBy === s ? 'white' : '#6B7280',
                  background: sortBy === s ? 'rgba(59,130,246,0.12)' : 'transparent',
                }}>
                <ArrowUpDown size={11} />
                {s === 'xp' ? 'XP' : s === 'quiz' ? 'Quiz' : 'Name'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <button onClick={() => setViewMode('cards')}
            className="px-3 py-1.5 rounded-md text-sm text-gray-400 font-medium transition-all"
            style={{ color: viewMode === 'cards' ? 'white' : '#6B7280', background: viewMode === 'cards' ? 'rgba(59,130,246,0.12)' : 'transparent' }}>
            Cards
          </button>
          <button onClick={() => setViewMode('table')}
            className="px-3 py-1.5 rounded-md text-sm text-gray-400 font-medium transition-all"
            style={{ color: viewMode === 'table' ? 'white' : '#6B7280', background: viewMode === 'table' ? 'rgba(59,130,246,0.12)' : 'transparent' }}>
            Table
          </button>
        </div>
      </div>

      {/* Student Grid / Table */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Users size={24} className="text-blue-400" />
          </div>
          <p className="text-base text-gray-300 font-medium">No students enrolled</p>
          <p className="text-sm text-gray- mt-1">Students will appear here when they join your class</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((s, i) => {
            const isLow = (s.total_xp || 0) < 50 && (s.average_quiz_score || 0) < 40
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-4 transition-all hover:scale-[1.01] cursor-pointer group"
                style={{
                  background: isLow ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isLow ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-gray-400 font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #3B82F6)' }}>
                    {s.first_name?.[0]}{s.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                      {s.first_name} {s.last_name}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: isLow ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                        color: isLow ? '#F87171' : '#34D399',
                      }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: isLow ? '#F87171' : '#34D399' }} />
                      {isLow ? 'Needs Help' : 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400 font-semibold text-amber-400">
                    <Zap size={13} />
                    {s.total_xp || 0}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Quiz Avg', value: `${s.average_quiz_score || 0}%`, icon: Award, color: '#6366F1' },
                    { label: 'Notes Read', value: s.notes_viewed || 0, icon: BookOpen, color: '#3B82F6' },
                    { label: 'Doubts', value: s.doubts_raised || 0, icon: MessageCircle, color: '#F59E0B' },
                    { label: 'Attendance', value: `${s.attendance || 85}%`, icon: Clock, color: '#10B981' },
                  ].map(stat => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <Icon size={12} style={{ color: stat.color }} />
                        <div>
                          <p className="text-xs text-gray-500">{stat.label}</p>
                          <p className="text-sm text-gray- font-medium">{stat.value}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="text-left px-5 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Student</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">XP</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Quiz Avg</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Notes Read</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => {
                const isLow = (s.total_xp || 0) < 50 && (s.average_quiz_score || 0) < 40
                return (
                  <tr key={s.id} className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg, #6366F1, #3B82F6)' }}>
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <span className="text-sm text-gray-200">{s.first_name} {s.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-semibold text-amber-400 flex items-center gap-1">
                      <Zap size={12} /> {s.total_xp || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-">{s.average_quiz_score || 0}%</td>
                    <td className="px-4 py-3 text-sm text-gray-">{s.notes_viewed || 0}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded"
                        style={{
                          background: isLow ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                          color: isLow ? '#F87171' : '#34D399',
                        }}>
                        {isLow ? 'Needs Help' : 'Active'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
