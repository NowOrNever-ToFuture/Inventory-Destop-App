import { useState } from 'react'
import { useAuth } from '@renderer/components/shared/AuthProvider'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'

const APP_ICON = './icon_destop_app_1024x1024.png'

type Step = 'welcome' | 'database' | 'account' | 'store' | 'finish'

export function Setup() {
  const { refreshSetup } = useAuth()
  const toast = useToast()
  const [step, setStep] = useState<Step>('welcome')
  const [dataPath, setDataPath] = useState('')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePickFolder = async () => {
    try {
      const path = await window.api.settings.openFolderPicker()
      if (path) setDataPath(path)
    } catch (error) {
      reportAppError(toast, 'SETUP-PICK-01', 'Không chọn được thư mục.', error)
    }
  }

  const handleFinish = async () => {
    if (!username.trim() || password.length < 4) {
      toast.error('Tên đăng nhập và mật khẩu (ít nhất 4 ký tự) là bắt buộc.')
      return
    }
    setLoading(true)
    try {
      const result = await window.api.auth.setup(
        username.trim(),
        password,
        storeName.trim() || 'HomeInventory',
        dataPath.trim()
      )
      if (result.success) {
        toast.success('Cài đặt hoàn tất! Vui lòng đăng nhập.')
        await refreshSetup()
      } else {
        toast.error(result.message || 'Cài đặt thất bại.')
      }
    } catch (error) {
      reportAppError(toast, 'SETUP-ERR', 'Lỗi cài đặt.', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src={APP_ICON}
            alt="HomeInventory"
            className="size-16 rounded-xl object-cover shadow-sm"
          />
          <h1 className="text-xl font-bold text-gray-900">Cài đặt lần đầu</h1>
          <p className="text-sm text-gray-500 text-center">
            Vui lòng cấu hình thông tin cơ bản để bắt đầu sử dụng.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {(['welcome', 'database', 'account', 'store'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${step === s ? 'bg-blue-600' : i < ['welcome', 'database', 'account', 'store'].indexOf(step) ? 'bg-blue-300' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        <div className="min-h-[260px]">
          {/* Welcome */}
          {step === 'welcome' && (
            <div className="flex flex-col gap-4 text-center py-6">
              <p className="text-gray-700">
                Chào mừng bạn đến với <strong>HomeInventory</strong>!
              </p>
              <p className="text-sm text-gray-500">
                Công cụ quản lý kho hàng gia đình. Chúng tôi sẽ hướng dẫn bạn thiết lập các thông số
                cơ bản.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-left text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <strong className="text-blue-700">①</strong> Chọn đường dẫn lưu dữ liệu
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <strong className="text-green-700">②</strong> Tạo tài khoản quản trị
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <strong className="text-purple-700">③</strong> Đặt tên cửa hàng
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <strong className="text-orange-700">④</strong> Hoàn tất
                </div>
              </div>
            </div>
          )}

          {/* Database / Data Path */}
          {step === 'database' && (
            <div className="flex flex-col gap-4 py-4">
              <h2 className="font-semibold text-gray-900">Đường dẫn lưu dữ liệu</h2>
              <p className="text-sm text-gray-500">
                Chọn thư mục lưu ảnh hoá đơn, báo cáo và cơ sở dữ liệu.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dataPath}
                  onChange={(e) => setDataPath(e.target.value)}
                  placeholder="Để trống sẽ dùng thư mục mặc định..."
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => void handlePickFolder()}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Chọn
                </button>
              </div>
              <p className="text-xs text-gray-400">Mặc định: userData/Data</p>
            </div>
          )}

          {/* Account */}
          {step === 'account' && (
            <div className="flex flex-col gap-4 py-4">
              <h2 className="font-semibold text-gray-900">Tài khoản quản trị</h2>
              <p className="text-sm text-gray-500">Tạo tài khoản để đăng nhập vào ứng dụng.</p>
              <div>
                <label
                  htmlFor="setup-user"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tên đăng nhập
                </label>
                <input
                  id="setup-user"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="setup-pass"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mật khẩu
                </label>
                <input
                  id="setup-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 4 ký tự"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Store name */}
          {step === 'store' && (
            <div className="flex flex-col gap-4 py-4">
              <h2 className="font-semibold text-gray-900">Tên cửa hàng</h2>
              <p className="text-sm text-gray-500">Tên này sẽ hiển thị trên thanh điều hướng.</p>
              <div>
                <label
                  htmlFor="setup-store"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tên cửa hàng
                </label>
                <input
                  id="setup-store"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="VD: Điện máy Quang Minh"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Finish */}
          {step === 'finish' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="size-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-700">Đang hoàn tất cài đặt…</p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          {step === 'welcome' ? (
            <div />
          ) : (
            <button
              type="button"
              onClick={() =>
                setStep(
                  step === 'database'
                    ? 'welcome'
                    : step === 'account'
                      ? 'database'
                      : step === 'store'
                        ? 'account'
                        : 'store'
                )
              }
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Quay lại
            </button>
          )}

          {step === 'finish' ? (
            <div />
          ) : (
            <button
              type="button"
              onClick={() => {
                if (step === 'store') {
                  setStep('finish')
                  void handleFinish()
                } else if (step === 'welcome') setStep('database')
                else if (step === 'database') setStep('account')
                else if (step === 'account') setStep('store')
              }}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {step === 'store' ? 'Hoàn tất' : 'Tiếp theo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
