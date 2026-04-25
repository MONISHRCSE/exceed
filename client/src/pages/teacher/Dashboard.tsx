import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { lecturesAPI, notesAPI, doubtsAPI, analyticsAPI } from '../../api'
import {
  Mic,
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Play,
  RefreshCw,
  Eye,
  Edit3,
  Download,
  Send,
  BarChart2,
  BookOpen,
  Search,
  Filter,
  ChevronRight,
  Activity,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Radio,
  Wand2,
  MonitorPlay
} from 'lucide-react'

// ── Mini sparkline (pure SVG) ──
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Status Badge ──
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'rgba(245,158,11,0.12)', text: '#FBBF24', label: 'Draft' },
    published: { bg: 'rgba(16,185,129,0.12)', text: '#34D399', label: 'Published' },
    processing: { bg: 'rgba(59,130,246,0.12)', text: '#60A5FA', label: 'Processing' },
    completed: { bg: 'rgba(16,185,129,0.12)', text: '#34D399', label: 'Completed' },
    transcribing: { bg: 'rgba(245,158,11,0.12)', text: '#FBBF24', label: 'Transcribing' },
    needs_review: { bg: 'rgba(239,68,68,0.12)', text: '#F87171', label: 'Needs Review' },
    pending: { bg: 'rgba(245,158,11,0.12)', text: '#FBBF24', label: 'Pending' },
  }
  const c = config[status] || config.draft
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.text }} />
      {c.label}
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' } }),
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ lectures: 0, published: 0, drafts: 0, pendingDoubts: 0, urgent: 0 })
  const [recentLectures, setRecentLectures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      lecturesAPI.list().catch(() => []),
      notesAPI.listForTeacher().catch(() => []),
      doubtsAPI.listForTeacher().catch(() => []),
    ]).then(([lectures, notes, doubts]) => {
      setRecentLectures(lectures)
      const published = notes.filter((n: any) => n.published_at).length
      const pending = doubts.filter((d: any) => d.status === 'pending')
      setStats({
        lectures: lectures.length,
        published,
        drafts: notes.length - published,
        pendingDoubts: pending.length,
        urgent: pending.filter((d: any) => d.is_urgent).length,
      })
      setLoading(false)
    })
  }, [])

  const filteredLectures = recentLectures.filter(l => {
    const matchesSearch = l.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[140px] rounded-2xl shimmer" />
          ))}
        </div>
        <div className="h-[120px] rounded-2xl shimmer" />
        <div className="h-[300px] rounded-2xl shimmer" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Hero Analytics Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: 'Total Lectures',
            value: stats.lectures,
            delta: '+12%',
            deltaUp: true,
            icon: Mic,
            color: '#3B82F6',
            sparkData: [4, 7, 5, 9, 6, 8, 11, 13, 10, 14],
            sub: 'this week',
          },
          {
            label: 'Notes Published',
            value: stats.published,
            delta: `${stats.drafts} drafts`,
            deltaUp: false,
            icon: FileText,
            color: '#10B981',
            sparkData: [2, 3, 5, 4, 6, 8, 7, 9, 11, 10],
            sub: 'ready to review',
          },
          {
            label: 'Student Engagement',
            value: '78%',
            delta: '+5%',
            deltaUp: true,
            icon: Users,
            color: '#6366F1',
            sparkData: [60, 65, 62, 70, 68, 72, 75, 73, 78, 80],
            sub: 'avg completion',
          },
          {
            label: 'Pending Doubts',
            value: stats.pendingDoubts,
            delta: stats.urgent > 0 ? `${stats.urgent} urgent` : 'all clear',
            deltaUp: false,
            icon: AlertTriangle,
            color: stats.pendingDoubts > 5 ? '#EF4444' : '#F59E0B',
            sparkData: [8, 6, 9, 5, 7, 4, 6, 3, 5, stats.pendingDoubts],
            sub: '< 2h SLA',
          },
        ].map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="relative overflow-hidden rounded-2xl p-5 cursor-pointer group transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Glow accent */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] blur-2xl transition-opacity group-hover:opacity-[0.12]"
                style={{ background: card.color }} />

              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg" style={{ background: `${card.color}15` }}>
                  <Icon size={18} style={{ color: card.color }} strokeWidth={1.8} />
                </div>
                <Sparkline data={card.sparkData} color={card.color} />
              </div>

              <p className="text-2xl font-semibold text-white tracking-tight">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>

              <div className="flex items-center gap-2 mt-3">
                <span className={`flex items-center gap-1 text-xs font-medium ${card.deltaUp ? 'text-emerald-400' : card.color === '#EF4444' ? 'text-red-400' : 'text-amber-400'}`}>
                  {card.deltaUp ? <TrendingUp size={12} /> : null}
                  {card.delta}
                </span>
                <span className="text-xs text-gray-600">{card.sub}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Primary Workflow Pipeline ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Content Pipeline</h2>
            <p className="text-sm text-gray-500">Record, process, publish, and monitor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Record Lecture',
              description: 'Capture audio with live transcription',
              icon: Radio,
              color: '#3B82F6',
              action: 'Start Recording',
              link: '/teacher/record',
              details: ['Audio waveform capture', 'Real-time transcript', 'Auto-save enabled'],
            },
            {
              step: '02',
              title: 'Process Content and publish to class ',
              description: 'AI-refine transcripts into structured notes',
              icon: Wand2,
              color: '#1625C6',
              action: 'Refine Notes',
              link: '/teacher/notes',
              details: ['Transcript cleanup', 'Key concept extraction', 'Translation queue'],
            },

            {
              step: '03',
              title: 'Monitor Learning',
              description: 'Track engagement and quiz performance',
              icon: MonitorPlay,
              color: '#F59E0B',
              action: 'View Analytics',
              link: '/teacher/analytics',
              details: ['Student view stats', 'Quiz performance', 'Weak topic alerts'],
            },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.step}
                custom={i + 4}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="group relative rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] cursor-pointer flex flex-col h-full"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onClick={() => navigate(item.link)}
              >
                {/* Step connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 z-10 flex items-center justify-center">
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: `${item.color}15`, color: item.color }}>
                      {item.step}
                    </span>
                    <div className="p-1.5 rounded-lg" style={{ background: `${item.color}10` }}>
                      <Icon size={16} style={{ color: item.color }} strokeWidth={1.8} />
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">{item.description}</p>

                  <ul className="space-y-1.5 mb-4">
                    {item.details.map(d => (
                      <li key={d} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-1 h-1 rounded-full" style={{ background: item.color }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white transition-all group-hover:shadow-lg mt-auto"
                  style={{
                    background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)`,
                    boxShadow: `0 2px 10px ${item.color}30`,
                  }}
                >
                  {item.action}
                  <ArrowRight size={13} />
                </button>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Recent Lectures Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Table Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-base font-semibold text-white">Recent Lectures</h2>
            <p className="text-sm text-gray- mt-0.5">{recentLectures.length} total lectures</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search lectures..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-sm text-gray- placeholder-gray-600 bg-white/[0.04] border transition-colors focus:outline-none focus:border-blue-500/40"
                style={{ borderColor: 'rgba(255,255,255,0.08)', width: '180px' }}
              />
            </div>
            {/* Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm text-gray- bg-white/[0.04] border appearance-none cursor-pointer focus:outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="transcribing">Transcribing</option>
              <option value="draft">Draft</option>
            </select>
            <Link to="/teacher/notes" className="text-sm text-blue- hover:text-blue-300 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="text-left px-6 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Lecture Title</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Transcript</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-500 font-medium tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLectures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <Mic size={20} className="text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">No lectures found</p>
                      <p className="text-sm text-gray-">Record your first lecture to get started</p>
                      <button
                        onClick={() => navigate('/teacher/record')}
                        className="mt-2 px-4 py-2 rounded-lg text-sm text-gray-400 font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                      >
                        Start Recording
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLectures.slice(0, 8).map((lecture, i) => (
                  <tr
                    key={lecture.id}
                    className="group transition-colors hover:bg-white/[0.02] cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(59,130,246,0.1)' }}>
                          <BookOpen size={14} className="text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-200 font-medium truncate max-w-[200px] group-hover:text-white transition-colors">
                          {lecture.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-">
                        {new Date(lecture.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-">
                        {lecture.transcript ? `${lecture.transcript.length} chars` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={lecture.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors" title="View">
                          <Eye size={14} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors" title="Edit">
                          <Edit3 size={14} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors" title="Reprocess">
                          <RefreshCw size={14} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors" title="Publish">
                          <Send size={14} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors" title="Download">
                          <Download size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
