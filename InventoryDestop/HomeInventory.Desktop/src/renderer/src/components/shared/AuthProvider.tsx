import { createContext, use, useState, useCallback, useEffect, type ReactNode } from 'react'

interface AuthState {
  isLoggedIn: boolean
  username: string | null
  checkingSetup: boolean
  setupComplete: boolean
  setupStatus: string
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
    setupComplete: false,
    setupStatus: ''
  })

  const refreshSetup = useCallback(async () => {
    setState((s) => ({ ...s, checkingSetup: true, setupStatus: 'Dang kiem tra cau hinh...' }))
    try {
      // Check if installer left a config (from NSIS installer)
      const installerConfig = await window.api.installer.readConfig<{ dataPath: string; username: string; password: string; storeName: string; setupComplete: boolean }>()
      if (installerConfig?.setupComplete && installerConfig.username && installerConfig.password) {
        setState((s) => ({ ...s, setupStatus: 'Dang tao co so du lieu va tai khoan quan tri...' }))
        // Auto-run setup from installer config
        const result = await window.api.auth.setup(
          installerConfig.username,
          installerConfig.password,
          installerConfig.storeName || 'HomeInventory',
          installerConfig.dataPath || ''
        )
        if (result.success) {
          setState((s) => ({ ...s, setupStatus: 'Cai dat hoan tat!' }))
          await window.api.installer.clearConfig()
        }
      }
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
