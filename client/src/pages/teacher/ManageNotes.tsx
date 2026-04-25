import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { lecturesAPI, notesAPI } from '../../api'
import {
  FileText,
  Mic,
  Wand2,
  Globe,
  CreditCard,
  HelpCircle,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
  Edit3,
  BookOpen,
  Layers,
  Sparkles,
  Trash2
} from 'lucide-react'

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{
        background: published ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
        color: published ? '#34D399' : '#FBBF24',
      }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: published ? '#34D399' : '#FBBF24' }} />
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

export default function ManageNotes() {
  const [lectures, setLectures] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [searchQuery, setSearchQuery] = useState('')
  const [refiningId, setRefiningId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      lecturesAPI.list().catch(() => []),
      notesAPI.listForTeacher().catch(() => []),
    ]).then(([l, n]) => {
      setLectures(l); setNotes(n); setLoading(false)
    })
  }, [])

  const handleRefine = async (lectureId: string, transcript: string) => {
    setRefiningId(lectureId)
    const result = await notesAPI.refine(lectureId, transcript).catch(() => null)
    if (result) setNotes(prev => [...prev, result])
    setRefiningId(null)
  }

  const unrefined = lectures.filter(l => l.status === 'completed' && !notes.find((n: any) => n.lecture_id === l.id))
  const filteredNotes = notes.filter((n: any) => (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()))

  const tabs = [
    { id: 'notes', label: 'All Notes', icon: FileText, count: notes.length },
    { id: 'pending', label: 'Pending Refinement', icon: Clock, count: unrefined.length },
    { id: 'published', label: 'Published', icon: CheckCircle2, count: notes.filter((n: any) => n.published_at).length },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 shimmer rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: activeTab === tab.id ? 'white' : '#6B7280',
                  background: activeTab === tab.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                }}
              >
                <Icon size={15} />
                {tab.label}
                <span className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{
                    background: activeTab === tab.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                    color: activeTab === tab.id ? '#60A5FA' : '#6B7280',
                  }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-lg text-sm text-gray- placeholder-gray-600 bg-white/[0.04] border transition-colors focus:outline-none focus:border-blue-500/40"
            style={{ borderColor: 'rgba(255,255,255,0.08)', width: '200px' }}
          />
        </div>
      </div>

      {/* Pending Refinement Queue */}
      {(activeTab === 'pending' || (activeTab === 'notes' && unrefined.length > 0)) && unrefined.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-400" />
            <h2 className="text-base font-semibold text-white">Ready for AI Refinement</h2>
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-medium ml-1">{unrefined.length}</span>
          </div>
          <div className="space-y-2">
            {unrefined.map(l => (
              <div key={l.id} className="flex items-center gap-4 p-3.5 rounded-xl transition-colors hover:bg-white/[0.02]"
                style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <Mic size={15} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{l.title}</p>
                  <p className="text-xs text-gray-500">{new Date(l.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <button
                  onClick={() => handleRefine(l.id, l.transcript)}
                  disabled={refiningId === l.id}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm text-gray-400 font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #3B82F6)', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}
                >
                  <Wand2 size={13} />
                  {refiningId === l.id ? 'Refining...' : 'Refine'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notes Grid */}
      {(activeTab === 'notes' || activeTab === 'published') && (
        <div className="space-y-2">
          {(activeTab === 'published' ? filteredNotes.filter((n: any) => n.published_at) : filteredNotes).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(59,130,246,0.1)' }}>
                <FileText size={24} className="text-blue-400" />
              </div>
              <p className="text-base text-gray-300 font-medium">No notes yet</p>
              <p className="text-sm text-gray- mt-1">Record a lecture and refine the transcript</p>
            </div>
          ) : (
            (activeTab === 'published' ? filteredNotes.filter((n: any) => n.published_at) : filteredNotes).map((n: any, i: number) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/teacher/notes/${n.id}`}
                  className="group flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/[0.03]"
                  style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: n.published_at ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)' }}>
                    {n.published_at ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Edit3 size={16} className="text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">{n.title || 'Untitled Notes'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe size={10} />
                        {n.language?.toUpperCase() || 'EN'}
                      </span>
                      <span className="text-xs text-gray-600">v{n.version || 1}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge published={!!n.published_at} />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm('Are you sure you want to delete these notes? This will also remove any class sessions linked to these notes.')) {
                          notesAPI.delete(n.id).then(() => {
                            setNotes(notes.filter(note => note.id !== n.id));
                          }).catch(() => alert('Failed to delete notes'));
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition-colors"
                      title="Delete Notes"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
