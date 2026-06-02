import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@renderer/components/shared/AuthProvider'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'

const APP_ICON = '/icon_destop_app_1024x1024.png'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      toast.error('Vui lòng nhập tên đăng nhập và mật khẩu.')
      return
    }
    setLoading(true)
    try {
      const result = await login(username.trim(), password)
      if (result.success) {
        navigate('/', { replace: true })
      } else {
        toast.error(result.message || 'Đăng nhập thất bại.')
      }
    } catch (error) {
      reportAppError(toast, 'LOGIN-01', 'Lỗi đăng nhập.', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img
            src={APP_ICON}
            alt="HomeInventory"
            className="size-16 rounded-xl object-cover shadow-sm"
          />
          <h1 className="text-xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="text-sm text-gray-500">Phần mềm quản lý kho hàng</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-user" className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập
            </label>
            <input
              id="login-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              onKeyDown={(e) => e.key === 'Enter' && document.getElementById('login-pass')?.focus()}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="login-pass" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              id="login-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  )
}
