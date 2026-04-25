import { motion } from 'framer-motion'
import {
  FolderOpen,
  Upload,
  FileText,
  FileVideo,
  FileAudio,
  Image,
  Download,
  Search,
  Plus,
  Trash2,
  Eye
} from 'lucide-react'

const mockFiles = [
  { name: 'ML Fundamentals Slides.pdf', type: 'pdf', size: '2.4 MB', date: '2026-04-24' },
  { name: 'Lecture 3 Recording.webm', type: 'audio', size: '18.7 MB', date: '2026-04-22' },
  { name: 'CNN Architecture Diagram.png', type: 'image', size: '450 KB', date: '2026-04-20' },
  { name: 'Week 4 Notes Draft.md', type: 'doc', size: '12 KB', date: '2026-04-19' },
  { name: 'Student Performance Report.pdf', type: 'pdf', size: '1.1 MB', date: '2026-04-18' },
]

const iconMap: Record<string, any> = { pdf: FileText, audio: FileAudio, video: FileVideo, image: Image, doc: FileText }
const colorMap: Record<string, string> = { pdf: '#EF4444', audio: '#6366F1', video: '#3B82F6', image: '#10B981', doc: '#F59E0B' }

export default function Resources() {
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/[0.04]"
        style={{ background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.08)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(59,130,246,0.1)' }}>
          <Upload size={20} className="text-blue-400" />
        </div>
        <p className="text-sm text-gray-300 font-medium">Drop files here or click to upload</p>
        <p className="text-xs text-gray-600 mt-1">PDF, Audio, Video, Images up to 50MB</p>
      </div>

      {/* File List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-medium text-gray-300">All Resources</p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search files..."
              className="pl-8 pr-3 py-1.5 rounded-lg text-sm text-gray- placeholder-gray-600 bg-white/[0.04] border focus:outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.08)', width: '180px' }}
            />
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {mockFiles.map((file, i) => {
            const Icon = iconMap[file.type] || FileText
            const color = colorMap[file.type] || '#6B7280'
            return (
              <motion.div
                key={file.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}12` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.size} / {new Date(file.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-md hover:bg-white/[0.06]"><Eye size={13} className="text-gray-400" /></button>
                  <button className="p-1.5 rounded-md hover:bg-white/[0.06]"><Download size={13} className="text-gray-400" /></button>
                  <button className="p-1.5 rounded-md hover:bg-red-500/10"><Trash2 size={13} className="text-gray-600 hover:text-red-400" /></button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
