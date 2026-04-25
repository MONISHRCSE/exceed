import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'

interface User {
  id: string
  email: string
  role: 'teacher' | 'student'
  firstName: string
  lastName: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; role: string; firstName: string; lastName: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('exceed_token')
    if (token) {
      authAPI.verify()
        .then(data => setUser(data.user as User))
        .catch(() => localStorage.removeItem('exceed_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authAPI.login(email, password)
    localStorage.setItem('exceed_token', data.token)
    setUser(data.user as User)
  }, [])

  const register = useCallback(async (regData: { email: string; password: string; role: string; firstName: string; lastName: string }) => {
    const data = await authAPI.register(regData)
    localStorage.setItem('exceed_token', data.token)
    setUser(data.user as User)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('exceed_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
