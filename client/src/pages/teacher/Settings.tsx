import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Shield,
  Globe,
  Save,
  CheckCircle2
} from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sections = [
    {
      title: 'Profile',
      icon: User,
      fields: [
        { label: 'First Name', value: user?.firstName || '', type: 'text' },
        { label: 'Last Name', value: user?.lastName || '', type: 'text' },
        { label: 'Email', value: user?.email || '', type: 'email' },
        { label: 'Department', value: 'Computer Science', type: 'text' },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      toggles: [
        { label: 'Email notifications for new doubts', defaultOn: true },
        { label: 'Push notifications for student submissions', defaultOn: true },
        { label: 'Weekly analytics digest', defaultOn: false },
        { label: 'Lecture processing completion alerts', defaultOn: true },
      ]
    },
    {
      title: 'Preferences',
      icon: Palette,
      toggles: [
        { label: 'Dark mode (always on)', defaultOn: true },
        { label: 'Auto-save drafts', defaultOn: true },
        { label: 'Show AI suggestions in editor', defaultOn: true },
        { label: 'Compact table view by default', defaultOn: false },
      ]
    },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-400 font-medium"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#34D399' }}>
          <CheckCircle2 size={14} /> Settings saved successfully
        </motion.div>
      )}

      {sections.map((section, si) => {
        const Icon = section.icon
        return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.06 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Icon size={16} className="text-blue-400" />
              <h3 className="text-base font-semibold text-white">{section.title}</h3>
            </div>

            {section.fields && (
              <div className="grid grid-cols-2 gap-4">
                {section.fields.map(field => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{field.label}</label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      className="w-full px-3 py-2 rounded-lg text-sm text-gray-300 bg-white/[0.04] border focus:outline-none focus:border-blue-500/40"
                      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {section.toggles && (
              <div className="space-y-3">
                {section.toggles.map(toggle => (
                  <label key={toggle.label} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{toggle.label}</span>
                    <div className="relative">
                      <input type="checkbox" defaultChecked={toggle.defaultOn} className="sr-only peer" />
                      <div className="w-9 h-5 rounded-full transition-colors peer-checked:bg-blue-500/30 bg-white/[0.08]" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-blue-400 bg-gray-500" />
                    </div>
                  </label>
                ))}
              </div>
            )}
          </motion.div>
        )
      })}

      <button onClick={handleSave}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
        <Save size={15} /> Save Changes
      </button>
    </div>
  )
}
