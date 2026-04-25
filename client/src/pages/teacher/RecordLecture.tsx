import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { lecturesAPI, notesAPI } from '../../api'
import {
  Mic, Square, Play, Pause, AlertCircle, Clock, CheckCircle2, ChevronDown,
  Radio, Activity, MessageSquare, Zap, Target, Edit3, Bookmark, Flag,
  Wifi, ShieldCheck, Search, LayoutList, Share2, X, FileText, BrainCircuit,
  CreditCard, HelpCircle
} from 'lucide-react'

export default function RecordLecture() {
  const navigate = useNavigate()
  
  // Recording State
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle')
  const [time, setTime] = useState(0)
  const [title, setTitle] = useState('')
  const [selectedClass, setSelectedClass] = useState('Select Subject / Class')
  const [showClassDropdown, setShowClassDropdown] = useState(false)
  const [noiseLevel, setNoiseLevel] = useState(15) // percentage

  const classes = [
    'CS401 - Machine Learning',
    'CS301 - Data Structures',
    'CS505 - Advanced Algorithms',
    'CS202 - Database Systems',
    'General Session'
  ]
  const [audioQuality, setAudioQuality] = useState('Good')
  const [isSaved, setIsSaved] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  // AI Stream State (Simulated + Real)
  const [transcript, setTranscript] = useState([
    { time: '00:00', text: 'Alright class, let\'s get started. Today we are going to dive into Neural Networks.' }
  ])
  const [interimText, setInterimText] = useState('')
  const [concepts, setConcepts] = useState<string[]>([])
  const [topics, setTopics] = useState<{title: string, duration: string}[]>([])
  const [alerts, setAlerts] = useState<string[]>([])
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeRef = useRef(0)
  const recognitionRef = useRef<any>(null)
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(40).fill(10))

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onresult = (event: any) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            setTranscript(prev => {
              const h = Math.floor(timeRef.current / 3600)
              const m = Math.floor((timeRef.current % 3600) / 60)
              const s = timeRef.current % 60
              const tStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
              return [...prev, { time: tStr, text: transcriptPiece }]
            })
          } else {
            interim += transcriptPiece
          }
        }
        setInterimText(interim)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
      }
      
      recognitionRef.current = recognition
    }
  }, [])

  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => {
        setTime(t => {
          timeRef.current = t + 1
          return t + 1
        })
      }, 1000)
      setIsSaved(false)
      
      if (recognitionRef.current) {
        try { recognitionRef.current.start() } catch (e) { /* Already started */ }
      }
      
      // Simulate real-time waveform & AI detection
      waveformIntervalRef.current = setInterval(() => {
        setWaveformBars(prev => prev.map(() => Math.floor(Math.random() * 80) + 20))
        setNoiseLevel(Math.floor(Math.random() * 30))
        
        // Randomly simulate AI detections
        const rnd = Math.random()
        setConcepts(prev => {
          if (rnd > 0.98 && prev.length < 5) return [...prev, ['Perceptrons', 'Activation Functions', 'Backpropagation', 'Loss Gradient', 'Epochs'][prev.length % 5]]
          return prev
        })
        setTopics(prev => {
          if (rnd > 0.99 && prev.length < 3) return [...prev, { title: ['Intro to Deep Learning', 'Math Behind Weights', 'Practical Examples'][prev.length % 3], duration: '05:00' }]
          return prev
        })
      }, 200)

      // Auto-save simulation
      const saveInterval = setInterval(() => {
        setIsSaved(true)
        setTimeout(() => { if (status === 'recording') setIsSaved(false) }, 2000)
      }, 10000)

      return () => {
        clearInterval(timerRef.current!)
        clearInterval(waveformIntervalRef.current!)
        clearInterval(saveInterval)
        if (recognitionRef.current) {
          try { recognitionRef.current.stop() } catch (e) {}
        }
      }
    } else if (status === 'paused') {
      setWaveformBars(Array(40).fill(10))
    }
  }, [status])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const canStart = title.trim() !== '' && selectedClass !== 'Select Subject / Class'

  const handleStart = () => {
    if (!canStart) {
      alert('Please enter a lecture title and select a subject before starting.')
      return
    }
    setStatus('recording')
  }
  const handlePause = () => setStatus('paused')
  const handleStop = () => {
    setStatus('stopped')
    setIsSaved(true)
    setShowModal(true)
  }

  const handleSaveAction = async (actionType: 'notes' | 'flashcards' | 'quiz' | 'edit' | 'draft' | 'publish') => {
    if (transcript.length === 0) {
      alert('No transcript recorded.')
      return;
    }
    setProcessing(true)
    try {
      const fullTitle = selectedClass && selectedClass !== 'Select Subject / Class' 
        ? `[${selectedClass}] ${title || 'Untitled Lecture'}` 
        : (title || 'Untitled Lecture')
        
      const token = localStorage.getItem('exceed_token')
      const lectureRes = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: fullTitle })
      })
      if (!lectureRes.ok) throw new Error('Failed to create lecture')
      const lecture = await lectureRes.json()

      const fullText = transcript.map(t => t.text).join(' ')
      await lecturesAPI.transcribe(lecture.id, fullText)

      const notesRes = await notesAPI.refine(lecture.id, fullText)
      
      if (!notesRes || !notesRes.id) throw new Error('Failed to generate notes')

      if (actionType === 'publish') {
        await notesAPI.publish(notesRes.id)
        navigate('/teacher')
      } else if (actionType === 'draft') {
        navigate('/teacher/notes')
      } else {
        navigate(`/teacher/notes/${notesRes.id}`)
      }
    } catch (error) {
      console.error('Error processing lecture:', error)
      alert('Failed to process lecture. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      
      {/* ── HEADER BAR ── */}
      <div className="flex-none flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
        <div className="flex flex-col relative z-30">
          <input
            type="text"
            value={title}
            placeholder="Enter lecture title..."
            onChange={(e) => setTitle(e.target.value)}
            disabled={status !== 'idle'}
            className="text-lg font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1 -ml-1 transition-all placeholder-gray-600 w-full min-w-[300px] disabled:opacity-80"
          />
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            Record, transcribe, and process in real-time
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="relative">
              <button 
                onClick={() => status === 'idle' && setShowClassDropdown(!showClassDropdown)}
                className={`flex items-center gap-1 transition-colors ${status === 'idle' ? 'hover:text-gray-300' : 'opacity-80 cursor-default'}`}
              >
                {selectedClass} {status === 'idle' && <ChevronDown size={12} />}
              </button>
              <AnimatePresence>
                {showClassDropdown && status === 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-[#1a2235] border border-white/[0.08] rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {classes.map(c => (
                      <button 
                        key={c}
                        onClick={() => { setSelectedClass(c); setShowClassDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors"
                      >
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* System Indicators */}
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-gray-400" title="Microphone Active">
              <Mic size={12} className={status === 'recording' ? 'text-emerald-400' : ''} />
              <span className="hidden sm:inline">Rode NT-USB</span>
            </div>
            <div className="w-[1px] h-3 bg-white/[0.1]" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400" title="Network Connection">
              <Wifi size={12} className="text-emerald-400" />
            </div>
            <div className="w-[1px] h-3 bg-white/[0.1]" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400" title="Auto-save Status">
              <ShieldCheck size={12} className={isSaved ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Saving...'}</span>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 px-3 py-1.5 rounded-lg w-28 justify-center">
              {status === 'recording' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              {status === 'paused' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
              {status === 'idle' && <span className="w-2 h-2 rounded-full bg-gray-500" />}
              <span className="text-sm font-mono text-gray-200">{formatTime(time)}</span>
            </div>
            {status === 'recording' ? (
              <button onClick={handleStop} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                <Square size={14} fill="currentColor" /> Stop Lecture
              </button>
            ) : status === 'paused' ? (
              <div className="flex items-center gap-3">
                <button onClick={handleStart} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                  <Play size={14} fill="currentColor" /> Resume
                </button>
                <button onClick={handleStop} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
                  <Square size={14} fill="currentColor" /> Stop Lecture
                </button>
              </div>
            ) : (
              <button 
                onClick={handleStart} 
                disabled={!canStart}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-lg ${canStart ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' : 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'}`}
              >
                <Mic size={14} /> Start Lecture
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0 overflow-hidden relative z-10">
        
        {/* ── LEFT PANEL: RECORDING CORE ── */}
        <div className="lg:col-span-2 flex flex-col gap-5 overflow-hidden">
          
          {/* Hub */}
          <div className="flex-1 rounded-2xl relative flex flex-col items-center justify-center border border-white/[0.04] bg-white/[0.01] overflow-hidden">
            {/* Background radial gradient */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${status === 'recording' ? 'opacity-100' : 'opacity-0'}`}
                 style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.08) 0%, transparent 60%)' }} />

            {/* Central Recording Button */}
            <div className="relative mb-8">
              {status === 'recording' && (
                <>
                  <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-full bg-red-500" />
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, delay: 0.5, repeat: Infinity }} className="absolute inset-0 rounded-full bg-red-500" />
                </>
              )}
              <button
                onClick={status === 'recording' ? handlePause : handleStart}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  status === 'recording' ? 'bg-red-500 shadow-red-500/30' : 
                  status === 'paused' ? 'bg-amber-500 shadow-amber-500/30' : 
                  'bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08]'
                }`}
              >
                {status === 'recording' ? <Pause size={40} className="text-white" fill="currentColor" /> : <Mic size={40} className={status === 'paused' ? 'text-white' : 'text-blue-400'} />}
              </button>

              {/* Noise Level Ring */}
              <svg className="absolute -inset-6 w-44 h-44 -rotate-90 pointer-events-none">
                <circle cx="88" cy="88" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                {status === 'recording' && (
                  <circle cx="88" cy="88" r="80" fill="none" stroke={noiseLevel > 20 ? '#EF4444' : '#10B981'} strokeWidth="2" strokeDasharray="502" strokeDashoffset={502 - (502 * (noiseLevel * 3)) / 100} className="transition-all duration-200" />
                )}
              </svg>
            </div>

            {/* Timer & Stats */}
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-5xl font-mono tracking-tight text-white font-light drop-shadow-md mb-3">{formatTime(time)}</h2>
              <div className="flex items-center justify-center gap-4 text-xs font-medium">
                <span className={`px-2.5 py-1 rounded-md bg-white/[0.04] border ${audioQuality === 'Good' ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400'}`}>
                  Quality: {audioQuality}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-gray-400 flex items-center gap-1.5">
                  <Activity size={12} /> Noise: {noiseLevel}%
                </span>
                {status === 'recording' && noiseLevel < 5 && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Silence detected
                  </motion.span>
                )}
              </div>
            </div>

            {/* Visualizer */}
            <div className="w-full max-w-2xl px-12 h-16 flex items-end justify-center gap-1 mt-auto mb-10">
              {waveformBars.map((height, i) => (
                <motion.div
                  key={i}
                  animate={{ height: `${height}%` }}
                  transition={{ type: 'tween', duration: 0.1 }}
                  className={`w-1.5 rounded-full ${status === 'idle' ? 'bg-gray-800' : height > 70 ? 'bg-red-400' : height > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
              ))}
            </div>

            {/* Floating Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl bg-surface-900/80 backdrop-blur-md border border-white/[0.08] shadow-2xl">
              <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors" title="Mark Important (Flag)">
                <Flag size={16} />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors" title="Bookmark Timestamp">
                <Bookmark size={16} />
              </button>
              <div className="w-[1px] h-4 bg-white/[0.1] mx-1" />
              <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors" title="Add Annotation">
                <Edit3 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: AI LIVE INSIGHTS ── */}
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.02] flex items-center gap-2">
            <BrainCircuit size={16} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">AI Live Insights</h3>
            {status === 'recording' && <span className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            
            {/* Live Transcription Status */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                Transcription Status
                <span className="text-indigo-400 lowercase normal-case flex items-center gap-1"><Radio size={10} /> Live</span>
              </p>
              <div className="flex gap-4">
                <div className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Speed</p>
                  <p className="text-lg font-semibold text-white">124 <span className="text-xs font-normal text-gray-500">WPM</span></p>
                </div>
                <div className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Accuracy</p>
                  <p className="text-lg font-semibold text-emerald-400">98%</p>
                </div>
              </div>
            </div>

            {/* Key Concepts */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Detected Concepts</p>
              {concepts.length === 0 ? (
                <p className="text-xs text-gray-600 italic">Listening for key terms...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {concepts.map((concept, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-colors"
                      >
                        {concept}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Topic Segmentation */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Topic Timeline</p>
              {topics.length === 0 ? (
                <p className="text-xs text-gray-600 italic">Analyzing topics...</p>
              ) : (
                <div className="space-y-2 relative before:absolute before:inset-y-0 before:left-2 before:w-[1px] before:bg-white/[0.08]">
                  {topics.map((topic, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 relative z-10">
                      <div className="w-4 h-4 rounded-full bg-surface-950 border-[3px] border-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-200">{topic.title}</p>
                        <p className="text-xs text-gray-500">{topic.duration}</p>
                      </div>
                    </motion.div>
                  ))}
                  {status === 'recording' && (
                    <div className="flex gap-3 relative z-10 opacity-50">
                      <div className="w-4 h-4 rounded-full bg-surface-950 border-[3px] border-gray-600 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Current segment...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Smart Alerts */}
            {status === 'recording' && time > 15 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1">Suggestion</p>
                  <p className="text-xs text-gray-300 leading-relaxed">Consider defining "Activation Function" before proceeding to Backpropagation.</p>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>

      {/* ── BOTTOM PANEL: LIVE TRANSCRIPT ── */}
      <div className="flex-none h-48 mt-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] flex flex-col overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-surface-950/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-surface-950/80 to-transparent z-10 pointer-events-none" />
        
        <div className="absolute right-4 top-4 z-20 flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-gray-300 hover:bg-white/[0.1] transition-colors">Auto-scroll</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 font-mono custom-scrollbar">
          {status === 'idle' ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MessageSquare size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Live transcript will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcript.map((line, i) => (
                <div key={i} className="flex gap-4 group">
                  <span className="text-xs text-indigo-400/70 w-10 shrink-0 pt-0.5 select-none cursor-pointer group-hover:text-indigo-400 transition-colors">{line.time}</span>
                  <p className="text-sm text-gray-300 leading-relaxed group-hover:text-white transition-colors">{line.text}</p>
                </div>
              ))}
              {status === 'recording' && interimText && (
                <div className="flex gap-4">
                  <span className="text-xs text-indigo-400/50 w-10 shrink-0 pt-0.5">{formatTime(time).substring(3)}</span>
                  <p className="text-sm text-gray-500 leading-relaxed animate-pulse">{interimText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── POST-SESSION MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#111827] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Lecture Saved</h2>
                    <p className="text-xs text-gray-400">"{title}" • {formatTime(time)}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"><X size={18} /></button>
              </div>

              <div className="p-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Post-Processing Actions</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { title: 'Generate Smart Notes', desc: 'Convert transcript into structured study material', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', action: () => handleSaveAction('notes') },
                    { title: 'Create Flashcards', desc: 'Auto-extract Q&A pairs from concepts', icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10', action: () => handleSaveAction('flashcards') },
                    { title: 'Generate Quiz', desc: 'Create multiple choice assessment', icon: HelpCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', action: () => handleSaveAction('quiz') },
                    { title: 'Edit Transcript', desc: 'Review and fix audio transcription', icon: Edit3, color: 'text-gray-400', bg: 'bg-gray-500/10', action: () => handleSaveAction('edit') },
                  ].map(action => {
                    const Icon = action.icon
                    return (
                      <button 
                        key={action.title} 
                        onClick={action.action}
                        disabled={processing}
                        className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.bg}`}>
                          <Icon size={16} className={action.color} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200 group-hover:text-white mb-0.5">
                            {action.title}
                            {processing && <span className="ml-2 text-xs opacity-60 animate-pulse">Processing...</span>}
                          </p>
                          <p className="text-[11px] text-gray-500 leading-tight">{action.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                  <button 
                    onClick={() => handleSaveAction('draft')} 
                    disabled={processing}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button 
                    onClick={() => handleSaveAction('publish')} 
                    disabled={processing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Share2 size={16} /> Publish to Class
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
