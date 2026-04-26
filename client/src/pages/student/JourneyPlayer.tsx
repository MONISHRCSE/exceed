import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { journeysAPI, aiAPI } from '../../api'
import { ArrowLeft, Lock, CheckCircle2, Loader2, ChevronRight, X, RotateCcw, AlertCircle } from 'lucide-react'

// ── Layout constants ──────────────────────────────────────────────────────────
const NW = 196, NH = 54, MW = 520, VG = 128
const XP = [0.52, 0.60, 0.67, 0.60, 0.52, 0.40, 0.33, 0.40]
const nx = (i: number) => MW * XP[i % XP.length] - NW / 2
const ny = (i: number) => 72 + i * VG

const T: Record<string, any> = {
  learn:      { e: '📖', label: 'Learn',      c: '#EF4444', g: 'rgba(239,68,68,0.5)' },
  quiz:       { e: '🧩', label: 'Quiz',       c: '#8B5CF6', g: 'rgba(139,92,246,0.5)' },
  checkpoint: { e: '🏆', label: 'Checkpoint', c: '#F59E0B', g: 'rgba(245,158,11,0.5)' },
}

type S = 'locked' | 'active' | 'completed'
const getS = (node: any, done: Set<string>, nodes: any[]): S => {
  if (done.has(node.id)) return 'completed'
  const i = nodes.findIndex((n: any) => n.id === node.id)
  if (i === 0 || (i > 0 && done.has(nodes[i - 1]?.id))) return 'active'
  return 'locked'
}

// ── Quiz ─────────────────────────────────────────────────────────────────────
function Quiz({ quiz, onPass, onFail }: { quiz: any; onPass: () => void; onFail: () => void }) {
  const [qi, setQi] = useState(0)
  const [ans, setAns] = useState<Record<number, number>>({})
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const qs = quiz.questions || [], pass = quiz.passingScore || 70

  const submit = () => {
    if (qi < qs.length - 1) { setQi(q => q + 1); return }
    let c = 0; qs.forEach((q: any, i: number) => { if (ans[i] === q.correctIndex) c++ })
    const pct = Math.round(c / qs.length * 100); setScore(pct); setDone(true)
    if (pct >= pass) setTimeout(onPass, 1500); else setTimeout(onFail, 1500)
  }

  if (done) return (
    <div className="flex flex-col items-center py-8 gap-3 text-center">
      <div className="text-5xl">{score >= pass ? '🎉' : '😔'}</div>
      <p className={`text-2xl font-black ${score >= pass ? 'text-emerald-400' : 'text-red-400'}`}>{score}%</p>
      <p className="text-xs text-surface-400">{score >= pass ? 'Moving on…' : `Need ${pass}% — retrying…`}</p>
    </div>
  )

  const cur = qs[qi]
  return (
    <div className="space-y-4">
      <div className="flex gap-1">{qs.map((_: any, i: number) => <div key={i} className={`flex-1 h-1 rounded-full ${i <= qi ? 'bg-violet-500' : 'bg-surface-800'}`} />)}</div>
      <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Q{qi + 1} / {qs.length}</p>
      <p className="text-sm font-semibold text-surface-100 leading-relaxed">{cur?.text}</p>
      <div className="space-y-2">
        {(cur?.options || []).map((o: string, i: number) => {
          const sel = ans[qi] === i
          return (
            <button key={i} onClick={() => setAns(a => ({ ...a, [qi]: i }))}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${sel ? 'border-violet-500 bg-violet-500/10 text-violet-200' : 'border-surface-700 text-surface-400 hover:border-surface-600'}`}
              style={{ background: sel ? undefined : 'rgba(255,255,255,0.025)' }}>
              <span className={`inline-flex w-5 h-5 rounded-full mr-2.5 text-[10px] font-bold items-center justify-center ${sel ? 'bg-violet-500 text-white' : 'bg-surface-700 text-surface-400'}`}>
                {String.fromCharCode(65 + i)}
              </span>{o}
            </button>
          )
        })}
      </div>
      <button onClick={submit} disabled={ans[qi] === undefined}
        className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
        style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
        {qi === qs.length - 1 ? 'Submit Quiz' : 'Next'} →
      </button>
    </div>
  )
}

// ── Badge Modal ───────────────────────────────────────────────────────────────
function BadgeModal({ badge, onClose }: { badge: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="bg-surface-900 border border-amber-400/30 rounded-3xl p-12 text-center max-w-sm w-full animate-slide-up"
        style={{ boxShadow: '0 0 80px rgba(245,158,11,0.25)' }}>
        <div className="text-7xl mb-4">🏆</div>
        <div className="w-full h-px mb-6" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)' }} />
        <h2 className="text-xl font-black text-surface-50 mb-1">Journey Complete!</h2>
        <p className="text-amber-300 font-semibold text-sm mb-1">{badge.title}</p>
        <p className="text-surface-500 text-xs mb-8">{badge.description}</p>
        <button onClick={onClose} className="px-10 py-3 rounded-xl text-sm font-black text-white"
          style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }}>
          Claim Badge 🎉
        </button>
      </div>
    </div>
  )
}

// ── SVG path between consecutive nodes ───────────────────────────────────────
function PathLine({ i, nodes }: { i: number; nodes: any[] }) {
  if (i >= nodes.length - 1) return null
  const x1 = nx(i) + NW / 2, y1 = ny(i) + NH
  const x2 = nx(i + 1) + NW / 2, y2 = ny(i + 1)
  const my = (y1 + y2) / 2
  return (
    <path d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
      fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2"
      strokeDasharray="6 5" strokeLinecap="round" />
  )
}

// ── Side decoration (treasure chest or ?) ────────────────────────────────────
function SideDecor({ idx, node, done }: { idx: number; node: any; done: Set<string> }) {
  const x = nx(idx), rightSide = x > MW * 0.5
  const isChest = node.type === 'checkpoint'
  const isLocked = !done.has(node.id)
  const sx = rightSide ? nx(idx) - 60 : nx(idx) + NW + 16
  const sy = ny(idx) + NH / 2 - 18

  if (!isChest) return null
  return (
    <div className="absolute flex items-center justify-center w-9 h-9 text-2xl select-none transition-all"
      style={{ left: sx, top: sy, opacity: isLocked ? 0.35 : 1, filter: isLocked ? 'grayscale(1)' : undefined }}>
      🎁
    </div>
  )
}

// ── Journey Map Node ─────────────────────────────────────────────────────────
function MapNode({ idx, node, status, active, onClick }: {
  idx: number; node: any; status: S; active: boolean; onClick: () => void
}) {
  const cfg = T[node.type] || T.learn
  const x = nx(idx), y = ny(idx)

  const bg = status === 'completed'
    ? 'rgba(30,30,46,0.9)'
    : status === 'locked'
    ? 'rgba(20,20,34,0.7)'
    : 'rgba(26,26,42,0.95)'

  const border = status === 'active'
    ? `2px solid ${cfg.c}`
    : status === 'completed'
    ? '2px solid rgba(255,255,255,0.1)'
    : '2px solid rgba(255,255,255,0.07)'

  const shadow = active && status === 'active'
    ? `0 0 0 3px ${cfg.g}, 0 0 28px ${cfg.g}, 0 0 60px ${cfg.g}`
    : undefined

  return (
    <button
      onClick={onClick}
      disabled={status === 'locked'}
      className="absolute flex items-center gap-2.5 px-4 select-none transition-all duration-300"
      style={{
        left: x, top: y, width: NW, height: NH,
        background: bg, border, borderRadius: 999,
        boxShadow: shadow,
        opacity: status === 'locked' ? 0.45 : 1,
        cursor: status === 'locked' ? 'not-allowed' : 'pointer',
        transform: active && status === 'active' ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      {/* Icon area */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
        style={{ background: status === 'locked' ? 'rgba(255,255,255,0.05)' : `rgba(${cfg.c === '#EF4444' ? '239,68,68' : cfg.c === '#8B5CF6' ? '139,92,246' : '245,158,11'},0.15)` }}>
        {status === 'locked' ? <Lock className="w-3.5 h-3.5 text-surface-600" /> : status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : cfg.e}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-xs font-bold truncate leading-tight ${status === 'completed' ? 'text-surface-500' : status === 'locked' ? 'text-surface-700' : 'text-surface-100'}`}>
          {node.title}
        </p>
        <p className="text-[9px] font-semibold mt-0.5" style={{ color: status === 'active' ? cfg.c : 'rgba(255,255,255,0.25)' }}>
          {cfg.label}
        </p>
      </div>
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function JourneyPlayer() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()
  const [journey, setJourney] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [panel, setPanel] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [badge, setBadge] = useState<any>(null)
  const [qk, setQk] = useState(0)

  useEffect(() => {
    if (!journeyId) return
    journeysAPI.get(journeyId).then(d => {
      setJourney(d)
      const comp = new Set<string>(d.progress?.completedNodes || [])
      setDone(comp)
      const first = d.nodes?.find((_: any, i: number) => i === 0 || comp.has(d.nodes[i - 1]?.id))
      if (first && !comp.has(first.id)) setPanel(first)
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [journeyId])

  const completeNode = async (nodeId: string) => {
    if (!journeyId || submitting) return
    setSubmitting(true)
    try {
      const res = await journeysAPI.updateProgress(journeyId, nodeId)
      setDone(prev => new Set([...prev, nodeId]))
      if (res.badge) setBadge(res.badge)
      if (res.nextNodeId) {
        const next = journey.nodes.find((n: any) => n.id === res.nextNodeId)
        if (next) { setPanel(next); setQk(k => k + 1) }
      }
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center" style={{ background: GRID_BG }}>
      <Loader2 className="w-8 h-8 animate-spin text-surface-600" />
    </div>
  )
  if (error || !journey) return (
    <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center gap-4" style={{ background: GRID_BG }}>
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-sm text-surface-400">{error || 'Not found'}</p>
      <Link to="/student/story" className="text-sm text-primary-400">← Back</Link>
    </div>
  )

  const nodes: any[] = journey.nodes || []
  const mapH = ny(nodes.length - 1) + NH + 120
  const total = nodes.length, doneCount = done.size
  const pct = Math.round(doneCount / total * 100)

  return (
    <>
      {badge && <BadgeModal badge={badge} onClose={() => { setBadge(null); navigate('/student/story') }} />}

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">

        {/* ── MAP PANEL ── */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: GRID_BG }}>

          {/* Top bar */}
          <div className="flex items-center gap-3 px-6 py-3 shrink-0"
            style={{ background: 'rgba(10,12,24,0.7)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link to="/student/story"
              className="p-2 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800/60 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-surface-100 truncate">{journey.title}</p>
              <p className="text-[10px] text-surface-500">{doneCount}/{total} complete</p>
            </div>
            {/* Progress pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-20 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#F59E0B,#FBBF24)' : 'linear-gradient(90deg,#10B981,#34D399)' }} />
              </div>
              <span className="text-[10px] font-bold text-surface-400">{pct}%</span>
            </div>
          </div>

          {/* Map scroll area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center">
            <div className="relative shrink-0" style={{ width: MW, height: mapH }}>

              {/* SVG connection paths */}
              <svg className="absolute inset-0 pointer-events-none" width={MW} height={mapH}>
                {nodes.map((_: any, i: number) => <PathLine key={i} i={i} nodes={nodes} />)}
                {/* Finish star connection */}
                {nodes.length > 0 && (() => {
                  const last = nodes.length - 1
                  const x1 = nx(last) + NW / 2, y1 = ny(last) + NH
                  const x2 = MW / 2, y2 = ny(last) + NH + 60
                  return <path key="finish" d={`M${x1},${y1} C${x1},${y2} ${x2},${y2} ${x2},${y2}`}
                    fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" />
                })()}
              </svg>

              {/* Nodes */}
              {nodes.map((node: any, i: number) => {
                const status = getS(node, done, nodes)
                return (
                  <div key={node.id}>
                    <MapNode idx={i} node={node} status={status}
                      active={panel?.id === node.id}
                      onClick={() => { if (status !== 'locked') { setPanel(node); setQk(k => k + 1) } }} />
                    <SideDecor idx={i} node={node} done={done} />
                  </div>
                )
              })}

              {/* Finish node */}
              {nodes.length > 0 && (() => {
                const isComplete = doneCount >= total
                const fy = ny(nodes.length - 1) + NH + 50
                return (
                  <div className="absolute flex flex-col items-center gap-1 transition-all"
                    style={{ left: MW / 2 - 30, top: fy, opacity: isComplete ? 1 : 0.25 }}>
                    <div className="text-3xl" style={{ filter: isComplete ? 'drop-shadow(0 0 12px rgba(245,158,11,0.8))' : undefined }}>
                      🏁
                    </div>
                    <p className="text-[9px] font-bold text-surface-500 uppercase tracking-wider">
                      {isComplete ? 'Complete!' : 'Finish'}
                    </p>
                  </div>
                )
              })()}

              {/* Mystery nodes (bottom) — visual only */}
              {doneCount < total - 1 && (
                <div className="absolute flex gap-6"
                  style={{ left: MW / 2 - 40, top: ny(nodes.length - 1) + NH + 90, opacity: 0.3 }}>
                  <span className="text-3xl select-none">❓</span>
                  <span className="text-3xl select-none">❓</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT PANEL ── */}
        <div className={`flex flex-col border-l border-surface-800 bg-surface-950 transition-all duration-300 ${panel ? 'w-96 xl:w-[420px]' : 'w-0 overflow-hidden border-0'}`}>
          {panel && (
            <ContentPanel
              key={`${panel.id}-${qk}`}
              node={panel}
              status={getS(panel, done, nodes)}
              submitting={submitting}
              onComplete={() => completeNode(panel.id)}
              onQuizPass={() => completeNode(panel.id)}
              onQuizFail={() => setQk(k => k + 1)}
              onClose={() => setPanel(null)}
            />
          )}
        </div>
      </div>
    </>
  )
}

// ── Question Modal (focused overlay) ───────────────────────────────────
type MPhase = 'question' | 'reviewing' | 'result'

function QuestionModal({ node, onClose, onPassed, onQuizPass, onQuizFail, submitting }: {
  node: any; onClose: () => void; onPassed: () => void
  onQuizPass: () => void; onQuizFail: () => void; submitting: boolean
}) {
  const cfg = T[node.type] || T.learn
  const isQuiz = node.type === 'quiz'

  // free-text state
  const [phase, setPhase] = useState<MPhase>('question')
  const [answer, setAnswer] = useState('')
  const [evalResult, setEvalResult] = useState<{ score: number; feedback: string; passed: boolean } | null>(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)

  // mcq state
  const qs = node.quiz?.questions || []
  const passMark = node.quiz?.passingScore || 70
  const [qi, setQi] = useState(0)
  const [mcqAns, setMcqAns] = useState<Record<number, number>>({})
  const [mcqDone, setMcqDone] = useState(false)
  const [mcqScore, setMcqScore] = useState(0)

  const submitFreeText = async () => {
    if (!answer.trim() || evalLoading) return
    setEvalLoading(true); setEvalError(null); setPhase('reviewing')
    try {
      const r = await aiAPI.evaluateNode({ nodeTitle: node.title, concept: node.concept, nodeContent: node.content, userAnswer: answer })
      setEvalResult(r); setPhase('result')
    } catch (e: any) { setEvalError(e.message || 'Evaluation failed'); setPhase('question') }
    finally { setEvalLoading(false) }
  }

  const submitMcq = () => {
    if (qi < qs.length - 1) { setQi(q => q + 1); return }
    let c = 0; qs.forEach((q: any, i: number) => { if (mcqAns[i] === q.correctIndex) c++ })
    const pct = Math.round(c / qs.length * 100); setMcqScore(pct); setMcqDone(true)
    if (pct >= passMark) setTimeout(onQuizPass, 1600); else setTimeout(onQuizFail, 1600)
  }

  const scoreColor = evalResult ? (evalResult.score >= 70 ? 'text-emerald-400' : evalResult.score >= 30 ? 'text-amber-400' : 'text-red-400') : ''
  const scoreBg   = evalResult ? (evalResult.score >= 70 ? 'rgba(16,185,129,0.08)' : evalResult.score >= 30 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)') : ''
  const scoreBorder = evalResult ? (evalResult.score >= 70 ? 'rgba(16,185,129,0.3)' : evalResult.score >= 30 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)') : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="relative w-full max-w-md bg-surface-900 rounded-3xl overflow-hidden shadow-2xl animate-slide-up"
        style={{ border: `1px solid ${cfg.c}30`, boxShadow: `0 0 60px ${cfg.g}` }}>

        {/* Modal header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-800">
          <span className="text-xl">{isQuiz ? '🧩' : '✏️'}</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.c }}>
              {isQuiz ? 'Quiz' : 'Quick Check'}
            </p>
            <p className="text-xs font-semibold text-surface-300 truncate">{node.concept}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-surface-600 hover:text-surface-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* ── Free-text: question ── */}
          {!isQuiz && phase === 'question' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-2">Question</p>
                <p className="text-sm font-semibold text-surface-100 leading-relaxed">
                  In your own words, explain: <span className="font-bold" style={{ color: cfg.c }}>{node.concept}</span>
                </p>
              </div>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4}
                placeholder="Write your answer here… be as detailed as you can."
                className="w-full px-4 py-3 rounded-xl text-sm text-surface-200 resize-none focus:outline-none transition-all placeholder-surface-600"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
              {evalError && <p className="text-xs text-red-400">{evalError}</p>}
              <button onClick={submitFreeText} disabled={!answer.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
                Submit for AI Review →
              </button>
            </div>
          )}

          {/* ── Free-text: reviewing ── */}
          {!isQuiz && phase === 'reviewing' && (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
              <p className="text-sm font-semibold text-surface-300">AI is reviewing your answer…</p>
            </div>
          )}

          {/* ── Free-text: result ── */}
          {!isQuiz && phase === 'result' && evalResult && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5 text-center" style={{ background: scoreBg, border: `1px solid ${scoreBorder}` }}>
                <p className={`text-4xl font-black mb-1 ${scoreColor}`}>{evalResult.score}%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-3">
                  {evalResult.score >= 70 ? 'Excellent!' : evalResult.score >= 30 ? 'Good — cleared to continue' : 'Below passing score'}
                </p>
                <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${evalResult.score}%`, background: evalResult.score >= 70 ? '#10B981' : evalResult.score >= 30 ? '#F59E0B' : '#EF4444' }} />
                </div>
                <p className="text-[9px] text-surface-600 text-right">Min to pass: 30%</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] font-bold text-surface-600 uppercase tracking-wider mb-1">Your Answer</p>
                <p className="text-xs text-surface-400 italic leading-relaxed">{answer}</p>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[9px] font-bold text-surface-500 uppercase tracking-wider mb-2">AI Feedback</p>
                <p className="text-sm text-surface-300 leading-relaxed">{evalResult.feedback}</p>
              </div>
              {evalResult.passed ? (
                <button onClick={onPassed} disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>✓ Continue to next node <ChevronRight className="w-4 h-4" /></>}
                </button>
              ) : (
                <button onClick={() => { setAnswer(''); setEvalResult(null); setPhase('question') }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
                  ↺ Try Again ({evalResult.score}% — need 30%)
                </button>
              )}
            </div>
          )}

          {/* ── MCQ ── */}
          {isQuiz && !mcqDone && (
            <div className="space-y-4">
              <div className="flex gap-1">{qs.map((_: any, i: number) => <div key={i} className={`flex-1 h-1 rounded-full ${i <= qi ? 'bg-violet-500' : 'bg-surface-800'}`} />)}</div>
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Q{qi + 1} / {qs.length}</p>
              <p className="text-sm font-semibold text-surface-100 leading-relaxed">{qs[qi]?.text}</p>
              <div className="space-y-2">
                {(qs[qi]?.options || []).map((o: string, i: number) => {
                  const sel = mcqAns[qi] === i
                  return (
                    <button key={i} onClick={() => setMcqAns(a => ({ ...a, [qi]: i }))}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${sel ? 'border-violet-500 bg-violet-500/10 text-violet-200' : 'border-surface-700 text-surface-400 hover:border-surface-600'}`}
                      style={{ background: sel ? undefined : 'rgba(255,255,255,0.025)' }}>
                      <span className={`inline-flex w-5 h-5 rounded-full mr-2.5 text-[10px] font-bold items-center justify-center ${sel ? 'bg-violet-500 text-white' : 'bg-surface-700 text-surface-400'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>{o}
                    </button>
                  )
                })}
              </div>
              <button onClick={submitMcq} disabled={mcqAns[qi] === undefined}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>
                {qi === qs.length - 1 ? 'Submit Quiz' : 'Next →'}
              </button>
            </div>
          )}
          {isQuiz && mcqDone && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <div className="text-5xl">{mcqScore >= passMark ? '🎉' : '😔'}</div>
              <p className={`text-3xl font-black ${mcqScore >= passMark ? 'text-emerald-400' : 'text-red-400'}`}>{mcqScore}%</p>
              <p className="text-xs text-surface-400">{mcqScore >= passMark ? 'Quiz passed! Moving on…' : `Need ${passMark}% — retrying…`}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Content Panel (Learn Phase) ───────────────────────────────────────────
function ContentPanel({ node, status, submitting, onComplete, onQuizPass, onQuizFail, onClose }: {
  node: any; status: S; submitting: boolean
  onComplete: () => void; onQuizPass: () => void; onQuizFail: () => void; onClose: () => void
}) {
  const cfg = T[node.type] || T.learn
  const isCompleted = status === 'completed'
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {showModal && (
        <QuestionModal
          node={node}
          onClose={() => setShowModal(false)}
          onPassed={() => { setShowModal(false); onComplete() }}
          onQuizPass={() => { setShowModal(false); onQuizPass() }}
          onQuizFail={() => { setShowModal(false); onQuizFail() }}
          submitting={submitting}
        />
      )}

      <div className="flex flex-col h-full overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-2xl mt-0.5">{cfg.e}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: cfg.c }}>{cfg.label}</p>
            <h2 className="text-sm font-bold text-surface-100 leading-tight">{node.title}</h2>
            <p className="text-[10px] text-surface-500 mt-0.5">{node.concept}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-surface-600 hover:text-surface-300 hover:bg-surface-800 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — LEARN phase always shown */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">

          {/* Explanation */}
          <div className="rounded-2xl p-5 text-sm text-surface-300 leading-relaxed whitespace-pre-wrap"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {node.content || 'No content available.'}
          </div>

          {/* Analogy card — only if present */}
          {node.analogy && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">💡</span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Analogy</p>
              </div>
              <p className="text-sm text-surface-300 leading-relaxed italic">{node.analogy}</p>
            </div>
          )}

          {/* Completed badge */}
          {isCompleted && (
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300 font-semibold">Node completed — well done!</p>
            </div>
          )}
        </div>

        {/* Footer — Test me button */}
        {!isCompleted && (
          <div className="p-5 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-surface-600 text-center mb-3">
              Read the content above, then test your understanding
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg,${cfg.c},${cfg.c}cc)`, boxShadow: `0 4px 20px ${cfg.g}` }}>
              ✏️ Test my understanding →
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Grid background ───────────────────────────────────────────────────────────
const GRID_BG = `#10121C url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%2310121C'/%3E%3Crect width='20' height='20' fill='%23131520'/%3E%3Crect x='20' y='20' width='20' height='20' fill='%23131520'/%3E%3C/svg%3E")`

