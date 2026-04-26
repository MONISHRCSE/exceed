import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { journeysAPI, notesAPI } from '../../api'
import {
  Map, Plus, Loader2, Trophy, ChevronRight,
  Trash2, Clock, Sparkles, AlertCircle
} from 'lucide-react'

export default function StoryMode() {
  const navigate = useNavigate()
  const [journeys, setJourneys] = useState<any[]>([])
  const [notesList, setNotesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    Promise.all([
      journeysAPI.list().then(setJourneys).catch(() => {}),
      notesAPI.listForStudent().then(setNotesList).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleGenerate = async () => {
    if (!selectedNoteId) return
    const note = notesList.find((n: any) => n.id === selectedNoteId)
    if (!note) return
    setGenerating(true)
    setError(null)
    try {
      const journey = await journeysAPI.generate({
        notesId: note.id,
        title: note.title,
        content: note.content,
      })
      setJourneys(prev => [journey, ...prev])
      navigate(`/student/story/${journey.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to generate journey')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await journeysAPI.delete(id).catch(() => {})
    setJourneys(prev => prev.filter((j: any) => j.id !== id))
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-surface-950 p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto w-full">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
              <Map className="w-6 h-6 text-emerald-400" /> Story Mode
            </h1>
            <p className="text-sm text-surface-400 mt-1">
              Transform your notes into an interactive concept journey. Complete nodes to unlock the next step.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(o => !o)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
          >
            <Plus className="w-4 h-4" /> New Journey
          </button>
        </div>

        {/* Create panel */}
        {showCreate && (
          <div className="mb-8 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 animate-slide-up">
            <h2 className="text-sm font-bold text-emerald-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Generate a New Journey
            </h2>

            {notesList.length === 0 ? (
              <div className="flex items-center gap-3 text-sm text-surface-400 p-3 rounded-xl bg-surface-800/50">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                No notes available. Ask your teacher to publish notes or upload your own.
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Select Note Set</label>
                  <select
                    value={selectedNoteId}
                    onChange={e => setSelectedNoteId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-surface-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="">— Choose a note set —</option>
                    {notesList.map((n: any) => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-red-400 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!selectedNoteId || generating}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                  {generating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating journey…</>
                    : <><Sparkles className="w-4 h-4" /> Generate Journey</>}
                </button>
                {generating && (
                  <p className="text-xs text-surface-500 mt-2">
                    AI is analysing your notes and creating a concept map… this takes ~15 seconds.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Journey List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-surface-600" />
          </div>
        ) : journeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Map className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-surface-300 mb-2">No journeys yet</h3>
            <p className="text-sm text-surface-500 max-w-xs">
              Click "New Journey" and select a note set to generate your first concept journey.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {journeys.map((journey: any) => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                onOpen={() => navigate(`/student/story/${journey.id}`)}
                onDelete={e => handleDelete(journey.id, e)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function JourneyCard({ journey, onOpen, onDelete }: {
  journey: any
  onOpen: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const totalNodes = journey.nodes?.length || 0
  const completedNodes = Math.round((journey.progressPercentage / 100) * totalNodes)
  const isComplete = journey.completed || journey.progressPercentage >= 100

  return (
    <div
      onClick={onOpen}
      className="group flex items-center gap-5 p-5 rounded-2xl border cursor-pointer transition-all hover:border-emerald-500/30"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
        isComplete ? 'bg-amber-400/15 border border-amber-400/30' : 'bg-emerald-500/10 border border-emerald-500/20'
      }`}>
        {isComplete
          ? <Trophy className="w-6 h-6 text-amber-400" />
          : <Map className="w-6 h-6 text-emerald-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold text-surface-100 truncate">{journey.title}</h3>
          {isComplete && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0">
              Complete
            </span>
          )}
        </div>
        <p className="text-xs text-surface-500 truncate mb-2">{journey.description || `${totalNodes} concept nodes`}</p>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden max-w-48">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${journey.progressPercentage || 0}%`,
                background: isComplete ? 'linear-gradient(90deg,#F59E0B,#FBBF24)' : 'linear-gradient(90deg,#10B981,#34D399)',
              }}
            />
          </div>
          <span className="text-[10px] text-surface-500 font-medium shrink-0">{completedNodes}/{totalNodes} nodes</span>
          <span className="text-[10px] text-surface-600 flex items-center gap-1 shrink-0">
            <Clock className="w-2.5 h-2.5" />
            {new Date(journey.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-surface-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronRight className="w-5 h-5 text-surface-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  )
}
