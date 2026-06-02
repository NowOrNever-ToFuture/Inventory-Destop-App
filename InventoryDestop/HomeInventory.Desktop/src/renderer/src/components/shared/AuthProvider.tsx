import { createContext, use, useState, useCallback, useEffect, type ReactNode } from 'react'

interface AuthState {
  isLoggedIn: boolean
  username: string | null
  checkingSetup: boolean
  setupComplete: boolean
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  changePassword: (current: string, next: string) => Promise<{ success: boolean; message?: string }>
  refreshSetup: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    username: null,
    checkingSetup: true,
    setupComplete: false
  })

  const refreshSetup = useCallback(async () => {
    setState((s) => ({ ...s, checkingSetup: true }))
    try {
      const { setupComplete } = await window.api.auth.checkSetup()
      setState((s) => ({ ...s, setupComplete, checkingSetup: false }))
    } catch {
      setState((s) => ({ ...s, checkingSetup: false }))
    }
  }, [])

  useEffect(() => {
    void refreshSetup()
  }, [refreshSetup])

  const login = useCallback(async (username: string, password: string) => {
    const result = await window.api.auth.login(username, password)
    if (result.success) {
      setState((s) => ({ ...s, isLoggedIn: true, username: username.toLowerCase() }))
    }
    return result
  }, [])

  const logout = useCallback(() => {
    setState((s) => ({ ...s, isLoggedIn: false, username: null }))
  }, [])

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (!state.username) return { success: false, message: 'Chưa đăng nhập.' }
      const result = await window.api.auth.changePassword(state.username, current, next)
      return result
    },
    [state.username]
  )

  return (
    <AuthContext.Provider value={{ ...state, login, logout, changePassword, refreshSetup }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
