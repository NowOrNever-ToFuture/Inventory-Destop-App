import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@renderer/lib/utils"
import type { ReactNode } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, description, children, footer, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      if (!dialog.open) dialog.showModal()
      document.body.style.overflow = "hidden"
    } else {
      if (dialog.open) dialog.close()
      document.body.style.overflow = "unset"
    }
    return () => { document.body.style.overflow = "unset" }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (e: Event) => { e.preventDefault(); onClose() }
    dialog.addEventListener("cancel", handleCancel)
    return () => dialog.removeEventListener("cancel", handleCancel)
  }, [onClose])

  return createPortal(
    <dialog
      ref={dialogRef}
      className="fixed m-auto w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Đóng"
            >
              <X className="size-4" />
              <span className="sr-only">Đóng</span>
            </button>
          </div>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <div className="py-2">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-2">
            {footer}
          </div>
        )}
      </div>
    </dialog>,
    document.body
  )
}
