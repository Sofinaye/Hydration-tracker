import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadSession, signIn, signOut, signUp, type Session } from '../lib/auth'

type AuthContextValue = {
  user: Session | null
  loading: boolean
  login: (email: string, password: string) => ReturnType<typeof signIn>
  register: (email: string, password: string) => ReturnType<typeof signUp>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(loadSession())
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn(email, password)
    if (result.ok) setUser(loadSession())
    return result
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const result = await signUp(email, password)
    if (result.ok) setUser(loadSession())
    return result
  }, [])

  const logout = useCallback(() => {
    signOut()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
