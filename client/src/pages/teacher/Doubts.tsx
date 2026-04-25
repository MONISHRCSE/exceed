import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { doubtsAPI } from '../../api'
import {
  MessageCircleQuestion,
  Search,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mic,
  User,
  Sparkles,
  ArrowRight,
  Filter,
  Inbox,
  X
} from 'lucide-react'

export default function TeacherDoubts() {
  const [doubts, setDoubts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [response, setResponse] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    doubtsAPI.listForTeacher().then(setDoubts).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleRespond = async () => {
    if (!selected || !response.trim()) return
    setSending(true)
    try {
      await doubtsAPI.respond(selected.id, response)
      setDoubts(prev => prev.map(d => d.id === selected.id ? { ...d, response, status: 'answered', responded_at: new Date().toISOString() } : d))
      setSelected(null)
      setResponse('')
    } catch {}
    finally { setSending(false) }
  }

  const filtered = doubts
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => (d.question_text || '').toLowerCase().includes(searchQuery.toLowerCase()) || (d.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()))

  const pendingCount = doubts.filter(d => d.status === 'pending').length
  const answeredCount = doubts.filter(d => d.status === 'answered').length

  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-5 h-[calc(100vh-180px)]">
        <div className="col-span-2 space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
        <div className="col-span-3 shimmer rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {([
            { key: 'all', label: 'All', count: doubts.length },
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'answered', label: 'Answered', count: answeredCount },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                color: filter === f.key ? 'white' : '#6B7280',
                background: filter === f.key ? 'rgba(59,130,246,0.12)' : 'transparent',
              }}>
              {f.label}
              <span className="text-xs px-1.5 py-0.5 rounded-md"
                style={{
                  background: filter === f.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                  color: filter === f.key ? '#60A5FA' : '#6B7280',
                }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search doubts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-lg text-sm text-gray- placeholder-gray-600 bg-white/[0.04] border transition-colors focus:outline-none focus:border-blue-500/40"
            style={{ borderColor: 'rgba(255,255,255,0.08)', width: '200px' }}
          />
        </div>
      </div>

      {/* Main Layout: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5" style={{ minHeight: 'calc(100vh - 260px)' }}>
        {/* Doubts List */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden flex flex-col"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Inbox size={15} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Inbox</span>
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-semibold ml-auto">
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <MessageCircleQuestion size={20} className="text-blue-400" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No doubts found</p>
                <p className="text-xs text-gray-600 mt-1">Students haven't submitted any questions yet</p>
              </div>
            ) : (
              filtered.map(d => (
                <motion.button
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => { setSelected(d); setResponse(d.response || '') }}
                  className="w-full text-left p-3.5 rounded-xl transition-all"
                  style={{
                    background: selected?.id === d.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                    border: `1px solid ${selected?.id === d.id ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #3B82F6)' }}>
                        {(d.student_name || 'S')?.[0]}
                      </div>
                      <span className="text-sm text-gray-400 font-medium text-gray-300">{d.student_name || 'Student'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {d.is_voice && <Mic size={11} className="text-indigo-400" />}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          background: d.status === 'pending' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                          color: d.status === 'pending' ? '#FBBF24' : '#34D399',
                        }}>
                        <span className="w-1 h-1 rounded-full"
                          style={{ background: d.status === 'pending' ? '#FBBF24' : '#34D399' }} />
                        {d.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray- line-clamp-2 leading-relaxed">{d.question_text}</p>
                  <p className="text-[10px] text-gray-600 mt-2">
                    {new Date(d.submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3 rounded-2xl flex flex-col"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {selected ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full"
              >
                {/* Detail Header */}
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #3B82F6)' }}>
                      {(selected.student_name || 'S')?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{selected.student_name || 'Student'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(selected.submitted_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/[0.04]">
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>

                {/* Question */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Question</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{selected.question_text}</p>
                    {selected.is_voice && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-indigo-400">
                        <Mic size={10} /> Voice question
                      </span>
                    )}
                  </div>

                  {/* AI Suggested Answer */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 mb-2">
                      <Sparkles size={12} />
                      AI Suggested Response
                    </p>
                    <p className="text-sm text-gray- leading-relaxed italic">
                      Based on the lecture content, the student may be referring to the core concepts discussed in the session.
                      Consider addressing the foundational principles and providing an example to clarify.
                    </p>
                  </div>

                  {/* Existing response */}
                  {selected.response && selected.status === 'answered' && (
                    <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                        <CheckCircle2 size={12} />
                        Your Response
                      </p>
                      <p className="text-sm text-gray- leading-relaxed">{selected.response}</p>
                    </div>
                  )}
                </div>

                {/* Reply Area */}
                <div className="p-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <textarea
                    value={response}
                    onChange={e => setResponse(e.target.value)}
                    className="w-full h-28 px-4 py-3 rounded-xl text-sm text-gray-300 placeholder-gray-600 bg-white/[0.03] border resize-none leading-relaxed focus:outline-none focus:border-blue-500/30 mb-3"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    placeholder="Type your response..."
                  />
                  <div className="flex items-center justify-between">
                    <button className="text-sm text-gray- hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      Mark Resolved
                    </button>
                    <button
                      onClick={handleRespond}
                      disabled={sending || !response.trim()}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                    >
                      <Send size={14} />
                      {sending ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.08)' }}>
                <MessageCircleQuestion size={24} className="text-blue-400" />
              </div>
              <p className="text-base text-gray-400 font-medium">Select a doubt to respond</p>
              <p className="text-sm text-gray- mt-1">Choose from the inbox on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
