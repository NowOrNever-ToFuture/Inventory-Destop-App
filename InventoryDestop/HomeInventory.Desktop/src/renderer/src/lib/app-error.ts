import type { ToastApi } from '@renderer/components/shared/ToastProvider'

function extractErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim()
    const ipcPrefix = 'Error invoking remote method'
    if (!message.includes(ipcPrefix)) {
      return message
    }

    const marker = 'Error: '
    const markerIndex = message.lastIndexOf(marker)
    if (markerIndex >= 0) {
      const parsed = message.slice(markerIndex + marker.length).trim()
      return parsed || null
    }
  }

  return null
}

export function reportAppError(
  toast: ToastApi,
  code: string,
  userMessage: string,
  error: unknown
): void {
  const backendMessage = extractErrorMessage(error)
  const messageToCheck = (backendMessage ?? userMessage).toLowerCase()
  const shouldShowToUser =
    messageToCheck.includes('đã tồn tại') || messageToCheck.includes('không tìm thấy dữ liệu')

  if (shouldShowToUser) {
    toast.error(backendMessage ?? userMessage)
  }
  console.error(`[${code}] ${userMessage}`, error)
}
