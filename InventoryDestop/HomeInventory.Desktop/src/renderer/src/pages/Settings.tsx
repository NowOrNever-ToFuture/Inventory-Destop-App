import { useCallback, useEffect, useState } from 'react'
import { Settings as SettingsIcon, Folder, Save, RefreshCw, Lock } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { useAuth } from '@renderer/components/shared/AuthProvider'
import { reportAppError } from '@renderer/lib/app-error'
import type { AppSettingsDto } from '@shared/types/dtos/settings.dto'

export function Settings() {
  const toast = useToast()
  const { changePassword } = useAuth()
  const [settings, setSettings] = useState<AppSettingsDto>({
    storeName: 'HomeInventory',
    dataPath: ''
  })
  const [dataPath, setDataPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.settings.getAll()
      setSettings(data)
      setDataPath(data.dataPath)
    } catch (error) {
      reportAppError(toast, 'SET-LOAD-01', 'Không tải được cài đặt', error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleSaveStoreName = async () => {
    setSaving(true)
    try {
      const updated = await window.api.settings.set({
        key: 'storeName',
        value: settings.storeName.trim() || 'HomeInventory'
      })
      setSettings(updated)
      toast.success('Đã lưu tên cửa hàng')
      // Notify other components to refresh store name
      window.dispatchEvent(new CustomEvent('settings:updated', { detail: updated }))
    } catch (error) {
      reportAppError(toast, 'SET-SAVE-01', 'Không lưu được tên cửa hàng', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDataPath = async () => {
    setSaving(true)
    try {
      const updated = await window.api.settings.set({ key: 'dataPath', value: dataPath.trim() })
      setSettings(updated)
      toast.success('Đã lưu đường dẫn dữ liệu')
      window.dispatchEvent(new CustomEvent('settings:updated', { detail: updated }))
    } catch (error) {
      reportAppError(toast, 'SET-SAVE-02', 'Không lưu được đường dẫn', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePickFolder = async () => {
    try {
      const path = await window.api.settings.openFolderPicker()
      if (path) setDataPath(path)
    } catch (error) {
      reportAppError(toast, 'SET-PICK-01', 'Không chọn được thư mục', error)
    }
  }

  const resolvedPath = dataPath.trim() || '(mặc định: userData/Data)'

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Cài đặt</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cấu hình thông tin cửa hàng và đường dẫn lưu trữ.
        </p>
      </div>

      {/* Store name */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <SettingsIcon size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Thông tin cửa hàng</h2>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="store-name" className="text-sm font-medium text-gray-700">
            Tên cửa hàng
          </label>
          <div className="flex gap-2">
            <Input
              id="store-name"
              value={settings.storeName}
              onChange={(e) => setSettings((prev) => ({ ...prev, storeName: e.target.value }))}
              placeholder="Tên cửa hàng..."
              disabled={loading}
            />
            <Button
              onClick={() => void handleSaveStoreName()}
              disabled={saving || loading}
              icon={Save}
            >
              Lưu
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Tên này sẽ hiển thị trên thanh điều hướng sidebar.
          </p>
        </div>
      </div>

      {/* Data path */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Folder size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Đường dẫn lưu trữ</h2>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="data-path" className="text-sm font-medium text-gray-700">
            Thư mục lưu dữ liệu
          </label>
          <div className="flex gap-2">
            <Input
              id="data-path"
              value={dataPath}
              onChange={(e) => setDataPath(e.target.value)}
              placeholder="Để trống sẽ dùng mặc định..."
              disabled={loading}
            />
            <Button
              variant="outline"
              onClick={() => void handlePickFolder()}
              disabled={loading}
              icon={Folder}
            >
              Chọn
            </Button>
            <Button
              onClick={() => void handleSaveDataPath()}
              disabled={saving || loading}
              icon={Save}
            >
              Lưu
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Đường dẫn hiện tại: <span className="font-mono text-gray-700">{resolvedPath}</span>
          </p>
          <p className="text-xs text-gray-400">
            Folder <span className="font-mono">Data/HoaDonNhap</span> sẽ được tạo tự động trong thư
            mục này để lưu ảnh hoá đơn nhập.
          </p>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Đổi mật khẩu</h2>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="curr-pass" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu hiện tại
            </label>
            <Input
              id="curr-pass"
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại..."
            />
          </div>
          <div>
            <label htmlFor="new-pass" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <Input
              id="new-pass"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Ít nhất 4 ký tự..."
            />
          </div>
          <div>
            <label htmlFor="confirm-pass" className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
            />
          </div>
          <div>
            <Button
              onClick={() => {
                if (!currentPass) {
                  toast.error('Vui lòng nhập mật khẩu hiện tại.')
                  return
                }
                if (newPass.length < 4) {
                  toast.error('Mật khẩu mới phải có ít nhất 4 ký tự.')
                  return
                }
                if (newPass !== confirmPass) {
                  toast.error('Xác nhận mật khẩu không khớp.')
                  return
                }
                void changePassword(currentPass, newPass)
                  .then((r) => {
                    if (r.success) {
                      toast.success('Đổi mật khẩu thành công.')
                      setCurrentPass('')
                      setNewPass('')
                      setConfirmPass('')
                    } else toast.error(r.message || 'Đổi mật khẩu thất bại.')
                  })
                  .catch((e) => reportAppError(toast, 'SET-PASS-01', 'Lỗi đổi mật khẩu.', e))
              }}
              icon={Save}
            >
              Đổi mật khẩu
            </Button>
          </div>
        </div>
      </div>

      {/* Reload */}
      <div>
        <Button
          variant="outline"
          onClick={() => void loadSettings()}
          disabled={loading}
          icon={RefreshCw}
        >
          {loading ? 'Đang tải...' : 'Tải lại'}
        </Button>
      </div>
    </div>
  )
}
