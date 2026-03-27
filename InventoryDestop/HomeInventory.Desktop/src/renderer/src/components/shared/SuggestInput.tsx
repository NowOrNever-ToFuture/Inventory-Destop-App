import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@renderer/lib/utils"
import { Input } from "@renderer/components/ui/input"

interface SuggestItem {
  id: string
  label: string
  [key: string]: any
}

interface SuggestInputProps {
  value: string
  onValueChange: (val: string) => void
  onSelect: (item: SuggestItem) => void
  loadOptions: (inputValue: string) => Promise<SuggestItem[]>
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SuggestInput({
  value,
  onValueChange,
  onSelect,
  loadOptions,
  placeholder = "Nhập để tìm kiếm...",
  disabled,
  className,
}: SuggestInputProps) {
  const [options, setOptions] = React.useState<SuggestItem[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // Debounced search
  React.useEffect(() => {
    if (!value || value.length < 2) {
      setOptions([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await loadOptions(value)
        setOptions(results)
        setIsOpen(true)
      } catch (e) {
        console.error("SuggestInput loadOptions error:", e)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [value, loadOptions])

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (options.length > 0 && value.length >= 2) setIsOpen(true)
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="pl-9 bg-white"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
        )}
      </div>

      {isOpen && options.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg max-h-60 overflow-auto">
          {options.map((item) => (
            <button
              key={item.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex flex-col"
              onClick={() => {
                onSelect(item)
                setIsOpen(false)
              }}
            >
              <span className="font-medium text-gray-900">{item.label}</span>
              {item.description && (
                <span className="text-xs text-gray-500 mt-0.5">{item.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      {isOpen && !loading && value.length >= 2 && options.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-2 px-3 shadow-lg text-sm text-gray-500">
          Không tìm thấy kết quả. Bấm Enter để chọn model mới.
        </div>
      )}
    </div>
  )
}
