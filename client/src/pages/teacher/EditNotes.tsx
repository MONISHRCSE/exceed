import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { notesAPI } from '../../api'
import {
  FileText,
  Globe,
  CreditCard,
  HelpCircle,
  Save,
  Send,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  Target,
  List,
  BookOpen,
  Languages,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle
} from 'lucide-react'

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }, { code: 'hi', name: 'Hindi' }, { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' }, { code: 'pt', name: 'Portuguese' }, { code: 'ja', name: 'Japanese' },
]

export default function EditNotes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<any>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [activeTab, setActiveTab] = useState('editor')

  // Mock flashcards & quiz for demo
  const [flashcards] = useState([
    { q: 'What is supervised learning?', a: 'Learning from labeled training data', difficulty: 'Medium', tags: ['ML', 'Basics'] },
    { q: 'Define overfitting', a: 'When a model performs well on training data but poorly on unseen data', difficulty: 'Easy', tags: ['ML'] },
    { q: 'What is gradient descent?', a: 'An optimization algorithm that iteratively adjusts parameters to minimize a loss function', difficulty: 'Hard', tags: ['Optimization'] },
  ])
  const [quizQuestions] = useState([
    { question: 'Which algorithm is used for classification?', options: ['Linear Regression', 'Logistic Regression', 'K-Means', 'PCA'], correct: 1, explanation: 'Logistic regression outputs probabilities for classification tasks.' },
    { question: 'What does CNN stand for?', options: ['Central Neural Network', 'Convolutional Neural Network', 'Connected Node Network', 'Cascading Neuron Net'], correct: 1, explanation: 'CNNs use convolution layers for spatial feature extraction.' },
  ])

  useEffect(() => {
    if (id) notesAPI.get(id).then(n => { setNotes(n); setContent(n.content || '') }).catch(() => navigate('/teacher/notes'))
  }, [id])

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg); setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try { await notesAPI.update(id!, content); showMsg('Notes saved successfully') }
    catch { showMsg('Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await notesAPI.publish(id!)
      showMsg('Published successfully')
      setNotes((n: any) => ({ ...n, published_at: new Date().toISOString() }))
    } catch { showMsg('Publish failed', 'error') }
    finally { setPublishing(false) }
  }

  const handleTranslate = async () => {
    if (selectedLangs.length === 0) return
    setTranslating(true)
    try {
      await notesAPI.translate(id!, selectedLangs)
      showMsg(`Translated to ${selectedLangs.length} language(s)`)
    } catch { showMsg('Translation failed', 'error') }
    finally { setTranslating(false); setSelectedLangs([]) }
  }

  const toggleLang = (code: string) => setSelectedLangs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])

  if (!notes) return <div className="h-48 shimmer rounded-2xl" />

  const tabs = [
    { id: 'editor', label: 'Notes Editor', icon: FileText },
    { id: 'translate', label: 'Translation', icon: Languages },
    { id: 'flashcards', label: 'Flashcards', icon: CreditCard },
    { id: 'quiz', label: 'Quiz Generator', icon: HelpCircle },
  ]

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/teacher/notes')}
            className="p-2 rounded-lg transition-colors hover:bg-white/[0.04]"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{notes.title || 'Untitled Notes'}</h1>
            <p className="text-sm text-gray- flex items-center gap-2">
              <Globe size={11} /> {notes.language?.toUpperCase() || 'EN'}
              <span className="text-gray-700">|</span>
              v{notes.version || 1}
              {notes.published_at && (
                <>
                  <span className="text-gray-700">|</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={11} /> Published
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-400 font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#D1D5DB' }}>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={handlePublish} disabled={publishing || !!notes.published_at}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-400 font-semibold text-white disabled:opacity-50 transition-all hover:scale-[1.02]"
            style={{ background: notes.published_at ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #10B981, #059669)', color: notes.published_at ? '#34D399' : 'white' }}>
            {notes.published_at ? <><CheckCircle2 size={14} /> Published</> : <><Send size={14} /> {publishing ? 'Publishing...' : 'Publish'}</>}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 font-medium"
          style={{
            background: messageType === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${messageType === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
            color: messageType === 'success' ? '#34D399' : '#F87171',
          }}
        >
          {messageType === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {message}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                color: activeTab === tab.id ? 'white' : '#6B7280',
                background: activeTab === tab.id ? 'rgba(59,130,246,0.12)' : 'transparent',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab: Editor ── */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Editor */}
          <div className="lg:col-span-2 rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={15} className="text-blue-400" />
              <h2 className="text-base font-semibold text-white">Content Editor</h2>
              <span className="text-xs text-gray-600 ml-auto">Markdown supported</span>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full h-[500px] px-4 py-3 rounded-xl text-sm text-gray-300 placeholder-gray-600 bg-white/[0.03] border resize-none leading-relaxed font-mono focus:outline-none focus:border-blue-500/30"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              placeholder="Edit your structured notes here (supports Markdown)..."
            />
          </div>

          {/* AI Suggestions Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={15} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">AI Suggestions</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Lightbulb, label: 'Key Concepts', items: ['Neural Networks', 'Backpropagation', 'Loss Functions'] },
                  { icon: Target, label: 'Learning Objectives', items: ['Understand core ML pipeline', 'Implement basic models', 'Evaluate performance'] },
                  { icon: List, label: 'Summary Points', items: ['ML automates pattern recognition', 'Training requires labeled data', 'Validation prevents overfitting'] },
                ].map(section => {
                  const Icon = section.icon
                  return (
                    <div key={section.label} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-2">
                        <Icon size={12} className="text-indigo-400" />
                        {section.label}
                      </p>
                      <ul className="space-y-1">
                        {section.items.map(item => (
                          <li key={item} className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-indigo-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Translation ── */}
      {activeTab === 'translate' && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Languages size={16} className="text-blue-400" />
            <h2 className="text-base font-semibold text-white">Translate Notes</h2>
          </div>
          <p className="text-sm text-gray- mb-4">Select target languages for translation. Original: {notes.language?.toUpperCase() || 'EN'}</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {LANGUAGES.filter(l => l.code !== notes.language).map(lang => (
              <button key={lang.code} onClick={() => toggleLang(lang.code)}
                className="px-3.5 py-2 rounded-lg text-sm text-gray-400 font-medium transition-all"
                style={{
                  background: selectedLangs.includes(lang.code) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedLangs.includes(lang.code) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: selectedLangs.includes(lang.code) ? '#A5B4FC' : '#9CA3AF',
                }}>
                {lang.name}
              </button>
            ))}
          </div>
          <button onClick={handleTranslate} disabled={translating || selectedLangs.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366F1, #3B82F6)' }}>
            <Globe size={15} />
            {translating ? 'Translating...' : `Translate to ${selectedLangs.length} language(s)`}
          </button>
        </div>
      )}

      {/* ── Tab: Flashcards ── */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-amber-400" />
              <h2 className="text-base font-semibold text-white">Auto-Generated Flashcards</h2>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 font-medium">{flashcards.length}</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <Plus size={13} /> Add Card
            </button>
          </div>
          {flashcards.map((fc, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      background: fc.difficulty === 'Easy' ? 'rgba(16,185,129,0.12)' : fc.difficulty === 'Hard' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: fc.difficulty === 'Easy' ? '#34D399' : fc.difficulty === 'Hard' ? '#F87171' : '#FBBF24',
                    }}>
                    {fc.difficulty}
                  </span>
                  {fc.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-gray-500">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-white/[0.05]"><Edit3 size={12} className="text-gray-500" /></button>
                  <button className="p-1 rounded hover:bg-red-500/10"><Trash2 size={12} className="text-gray-600 hover:text-red-400" /></button>
                </div>
              </div>
              <p className="text-sm text-gray-200 font-medium mb-2">Q: {fc.q}</p>
              <p className="text-sm text-gray-">A: {fc.a}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Tab: Quiz ── */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Auto-Generated Quiz</h2>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 font-medium">{quizQuestions.length} questions</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #3B82F6)' }}>
              <Plus size={13} /> Add Question
            </button>
          </div>
          {quizQuestions.map((q, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-gray-200 font-medium">Q{i + 1}. {q.question}</p>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-white/[0.05]"><Edit3 size={12} className="text-gray-500" /></button>
                  <button className="p-1 rounded hover:bg-red-500/10"><Trash2 size={12} className="text-gray-600 hover:text-red-400" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {q.options.map((opt, oi) => (
                  <div key={oi}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400"
                    style={{
                      background: oi === q.correct ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${oi === q.correct ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      color: oi === q.correct ? '#34D399' : '#9CA3AF',
                    }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                      style={{
                        background: oi === q.correct ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                        color: oi === q.correct ? '#34D399' : '#6B7280',
                      }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Lightbulb size={11} className="text-amber-400" />
                {q.explanation}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
