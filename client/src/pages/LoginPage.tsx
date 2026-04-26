import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      // AuthContext will redirect via App router
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8 shadow-2xl animate-float">
            E
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Exceed</span>
          </h1>
          <p className="text-xl text-surface-300 mb-6">AI Multilingual Classroom</p>
          <p className="text-surface-400 leading-relaxed">
            Transform lectures into structured, multilingual learning materials.
            Record, transcribe, refine, translate, and deliver — all in one platform.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">🎙️</div>
              <p className="text-xs text-surface-400">Record & Transcribe</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🌍</div>
              <p className="text-xs text-surface-400">Multilingual</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🧠</div>
              <p className="text-xs text-surface-400">AI-Powered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass rounded-2xl p-8 glow-primary">
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg">
                E
              </div>
              <h1 className="text-2xl font-bold gradient-text">Exceed</h1>
            </div>

            <h2 className="text-2xl font-bold text-surface-100 mb-1">Welcome back</h2>
            <p className="text-surface-400 mb-8">Sign in to your account to continue</p>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-surface-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Quick Login / Demo Credentials */}
          <div className="mt-6 flex flex-col gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest text-center">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setEmail('student@exceed.com')
                  setPassword('password123')
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }, 100);
                }}
                className="group relative px-4 py-3 rounded-xl bg-surface-900 border border-surface-800 hover:border-accent-500/50 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  🎓
                </div>
                <p className="text-[10px] font-bold text-accent-400 mb-0.5">Student</p>
                <p className="text-xs text-surface-300 font-medium truncate">student@exceed.com</p>
              </button>

              <button
                onClick={() => {
                  setEmail('teacher@exceed.com')
                  setPassword('password123')
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }, 100);
                }}
                className="group relative px-4 py-3 rounded-xl bg-surface-900 border border-surface-800 hover:border-primary-500/50 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  👨‍🏫
                </div>
                <p className="text-[10px] font-bold text-primary-400 mb-0.5">Teacher</p>
                <p className="text-xs text-surface-300 font-medium truncate">teacher@exceed.com</p>
              </button>
            </div>
            <p className="text-[10px] text-surface-600 text-center italic">Form will automatically submit after clicking</p>
          </div>
        </div>
      </div>
    </div>
  )
}
