import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { analyticsAPI } from '../../api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell
} from 'recharts'
import {
  BarChart3,
  Users,
  Mic,
  Eye,
  TrendingUp,
  Target,
  BookOpen,
  Activity,
  Clock,
  Award
} from 'lucide-react'

const engagementData = [
  { week: 'W1', engagement: 65, quizAvg: 58, completion: 42 },
  { week: 'W2', engagement: 72, quizAvg: 63, completion: 48 },
  { week: 'W3', engagement: 68, quizAvg: 61, completion: 52 },
  { week: 'W4', engagement: 78, quizAvg: 70, completion: 58 },
  { week: 'W5', engagement: 82, quizAvg: 72, completion: 65 },
  { week: 'W6', engagement: 75, quizAvg: 68, completion: 60 },
  { week: 'W7', engagement: 85, quizAvg: 76, completion: 70 },
  { week: 'W8', engagement: 88, quizAvg: 80, completion: 74 },
]

const topicHeatmap = [
  { topic: 'Neural Networks', strength: 82 },
  { topic: 'Backpropagation', strength: 65 },
  { topic: 'CNNs', strength: 78 },
  { topic: 'RNNs', strength: 45 },
  { topic: 'Transformers', strength: 55 },
  { topic: 'Loss Functions', strength: 90 },
  { topic: 'Optimization', strength: 70 },
  { topic: 'Regularization', strength: 58 },
]

const radarData = [
  { subject: 'Attendance', A: 85 },
  { subject: 'Quiz Scores', A: 72 },
  { subject: 'Notes Viewed', A: 78 },
  { subject: 'Doubts Asked', A: 60 },
  { subject: 'Completion', A: 68 },
  { subject: 'Engagement', A: 82 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs"
      style={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}%</p>
      ))}
    </div>
  )
}

export default function TeacherAnalytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.teacher().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-[100px] shimmer rounded-2xl" />)}
        </div>
        <div className="h-[350px] shimmer rounded-2xl" />
      </div>
    )
  }

  const metrics = data || { totalStudents: 0, totalLectures: 0, avgQuizScore: 0, totalViews: 0, completionRate: 0 }

  const statCards = [
    { label: 'Total Students', value: metrics.totalStudents || 0, icon: Users, color: '#3B82F6', delta: '+8 this month' },
    { label: 'Total Lectures', value: metrics.totalLectures || 0, icon: Mic, color: '#6366F1', delta: '3 this week' },
    { label: 'Avg Quiz Score', value: `${metrics.avgQuizScore || 0}%`, icon: Award, color: '#10B981', delta: '+4% improvement' },
    { label: 'Content Views', value: metrics.totalViews || 0, icon: Eye, color: '#F59E0B', delta: '142 unique' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${card.color}12` }}>
                  <Icon size={16} style={{ color: card.color }} strokeWidth={1.8} />
                </div>
              </div>
              <p className="text-xl font-semibold text-white">{card.value}</p>
              <p className="text-sm text-gray- mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-600 mt-1">{card.delta}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Engagement Trend */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-blue-400" />
            <h3 className="text-base font-semibold text-white">Class Engagement Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={engagementData}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#3B82F6" fill="url(#gradBlue)" strokeWidth={2} />
              <Area type="monotone" dataKey="quizAvg" name="Quiz Avg" stroke="#6366F1" fill="url(#gradIndigo)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quiz Performance */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Student Performance Radar</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <PolarRadiusAxis tick={false} domain={[0, 100]} axisLine={false} />
              <Radar name="Performance" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Topic Strength Heatmap (bar chart) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Target size={16} className="text-amber-400" />
            <h3 className="text-base font-semibold text-white">Topic Strength Heatmap</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topicHeatmap} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="topic" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="strength" name="Strength" radius={[0, 6, 6, 0]} barSize={16}>
                {topicHeatmap.map((entry, i) => (
                  <Cell key={i} fill={entry.strength >= 75 ? '#10B981' : entry.strength >= 55 ? '#F59E0B' : '#EF4444'} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Completion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={16} className="text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Completion Rates</h3>
          </div>
          <div className="space-y-5 mt-2">
            {[
              { label: 'Notes Viewed', pct: metrics.completionRate || 72, color: '#3B82F6' },
              { label: 'Quizzes Completed', pct: metrics.avgQuizScore || 58, color: '#6366F1' },
              { label: 'Flashcards Reviewed', pct: 45, color: '#10B981' },
              { label: 'Planner Tasks Done', pct: 63, color: '#F59E0B' },
            ].map(bar => (
              <div key={bar.label}>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span className="text-gray-300">{bar.label}</span>
                  <span className="text-gray-400 font-medium tabular-nums">{bar.pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bar.pct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: bar.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
