import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  BookOpen,
  Mic,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const mockTasks = [
  { title: 'Record ML Lecture #5', type: 'recording', date: '2026-04-28', status: 'upcoming' },
  { title: 'Publish CNN Notes', type: 'notes', date: '2026-04-27', status: 'upcoming' },
  { title: 'Review student doubts', type: 'doubts', date: '2026-04-26', status: 'today' },
  { title: 'Create Week 5 Quiz', type: 'assessment', date: '2026-04-25', status: 'today' },
  { title: 'ML Basics Lecture', type: 'recording', date: '2026-04-24', status: 'completed' },
  { title: 'Translate notes to Hindi', type: 'notes', date: '2026-04-23', status: 'completed' },
]

export default function Planner() {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')

  const filtered = mockTasks.filter(t => filter === 'all' || t.status === filter)
  const typeIcons: Record<string, any> = { recording: Mic, notes: BookOpen, assessment: Target, doubts: Clock }
  const typeColors: Record<string, string> = { recording: '#EF4444', notes: '#3B82F6', assessment: '#6366F1', doubts: '#F59E0B' }

  return (
    <div className="space-y-6">
      {/* Filter & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {(['all', 'today', 'upcoming', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                color: filter === f ? 'white' : '#6B7280',
                background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent',
              }}>
              {f}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-400 font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filtered.map((task, i) => {
          const Icon = typeIcons[task.type] || Clock
          const color = typeColors[task.type] || '#6B7280'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/[0.03] cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}12` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium transition-colors ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
              {task.status === 'completed' ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                  style={{
                    background: task.status === 'today' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                    color: task.status === 'today' ? '#60A5FA' : '#FBBF24',
                  }}>
                  {task.status === 'today' ? 'Today' : 'Upcoming'}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
