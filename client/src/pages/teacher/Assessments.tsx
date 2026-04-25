import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardCheck,
  FileText,
  CreditCard,
  HelpCircle,
  Plus,
  Search,
  Eye,
  BarChart2,
  Clock,
  CheckCircle2
} from 'lucide-react'

export default function Assessments() {
  const [activeTab, setActiveTab] = useState('quizzes')

  const tabs = [
    { id: 'quizzes', label: 'Quizzes', icon: HelpCircle, count: 12 },
    { id: 'flashcards', label: 'Flashcard Sets', icon: CreditCard, count: 8 },
    { id: 'assignments', label: 'Assignments', icon: FileText, count: 3 },
  ]

  const mockQuizzes = [
    { title: 'ML Fundamentals Quiz', questions: 10, avgScore: 78, attempts: 24, status: 'active' },
    { title: 'Neural Networks Assessment', questions: 15, avgScore: 65, attempts: 18, status: 'active' },
    { title: 'Data Preprocessing Test', questions: 8, avgScore: 82, attempts: 30, status: 'closed' },
    { title: 'Deep Learning Mid-Term', questions: 20, avgScore: 0, attempts: 0, status: 'draft' },
  ]

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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-400 font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          <Plus size={14} /> Create New
        </button>
      </div>

      {/* Quizzes List */}
      <div className="space-y-2">
        {mockQuizzes.map((quiz, i) => (
          <motion.div
            key={quiz.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/[0.03] cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.1)' }}>
              <ClipboardCheck size={16} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{quiz.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">{quiz.questions} questions</span>
                <span className="text-xs text-gray-500">{quiz.attempts} attempts</span>
                {quiz.avgScore > 0 && <span className="text-xs text-gray-500">Avg: {quiz.avgScore}%</span>}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{
                background: quiz.status === 'active' ? 'rgba(16,185,129,0.12)' : quiz.status === 'draft' ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)',
                color: quiz.status === 'active' ? '#34D399' : quiz.status === 'draft' ? '#FBBF24' : '#9CA3AF',
              }}>
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ background: quiz.status === 'active' ? '#34D399' : quiz.status === 'draft' ? '#FBBF24' : '#9CA3AF' }} />
              {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
