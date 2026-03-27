import { AlertTriangle } from 'lucide-react'
import { Modal } from '@renderer/components/ui/modal'
import { Button } from '@renderer/components/ui/button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận hành động',
  description = 'Bạn có chắc chắn muốn thực hiện hành động này không? Việc này không thể hoàn tác.',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDestructive = true,
  loading = false
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="sm:max-w-[400px]"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center justify-center space-y-4 py-4 text-center">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            isDestructive ? 'bg-red-100' : 'bg-blue-100'
          }`}
        >
          <AlertTriangle
            className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Modal>
  )
}
