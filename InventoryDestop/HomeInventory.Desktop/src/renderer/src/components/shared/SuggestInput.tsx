import * as React from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { Input } from '@renderer/components/ui/input'

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

interface State {
  options: SuggestItem[]
  isOpen: boolean
  loading: boolean
}

type Action =
  | { type: 'CLEAR' }
  | { type: 'LOADING' }
  | { type: 'LOADED'; options: SuggestItem[] }
  | { type: 'CLOSE' }
  | { type: 'OPEN' }
  | { type: 'ERROR' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CLEAR':
      return { options: [], isOpen: false, loading: false }
    case 'LOADING':
      return { ...state, loading: true }
    case 'LOADED':
      return { options: action.options, isOpen: true, loading: false }
    case 'CLOSE':
      return { ...state, isOpen: false }
    case 'OPEN':
      return { ...state, isOpen: state.options.length > 0 }
    case 'ERROR':
      return { ...state, loading: false }
    default:
      return state
  }
}

export function SuggestInput({
  value,
  onValueChange,
  onSelect,
  loadOptions,
  placeholder = 'Nhập để tìm kiếm...',
  disabled,
  className
}: SuggestInputProps) {
  const [state, dispatch] = React.useReducer(reducer, {
    options: [],
    isOpen: false,
    loading: false
  })

  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const loadOptionsRef = React.useRef(loadOptions)
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => {
    loadOptionsRef.current = loadOptions
  }, [loadOptions])

  const isEmpty = !value || value.trim().length === 0

  React.useEffect(() => {
    if (isEmpty) {
      dispatch({ type: 'CLEAR' })
      return
    }

    let cancelled = false
    dispatch({ type: 'LOADING' })

    const timer = setTimeout(async () => {
      try {
        const results = await loadOptionsRef.current(value)
        if (!cancelled) {
          dispatch({ type: 'LOADED', options: results })
        }
      } catch (e) {
        console.error('SuggestInput loadOptions error:', e)
        if (!cancelled) dispatch({ type: 'ERROR' })
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value, isEmpty])

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        dispatch({ type: 'CLOSE' })
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reposition dropdown when open
  React.useEffect(() => {
    if (state.isOpen && wrapperRef.current && state.options.length > 0) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${Math.max(rect.width, 280)}px`,
        zIndex: 9999
      })
    }
  }, [state.isOpen, state.options.length])

  return (
    <div className={cn('relative w-full', className)} ref={wrapperRef} style={{ minWidth: 0 }}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value)
          }}
          onFocus={() => dispatch({ type: 'OPEN' })}
          disabled={disabled}
          placeholder={placeholder}
          className="pl-9 bg-white"
        />
        {state.loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
        )}
      </div>

      {/* Teleported dropdown - renders at body level, not clipped by parents */}
      {state.isOpen &&
        state.options.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="rounded-md border border-gray-200 bg-white py-1 shadow-lg max-h-60 overflow-auto"
          >
            {state.options.map((item) => (
              <button
                type="button"
                key={item.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex flex-col"
                onClick={() => {
                  onSelect(item)
                  dispatch({ type: 'CLOSE' })
                }}
              >
                <span className="font-medium text-gray-900">{item.label}</span>
                {item.description && (
                  <span className="text-xs text-gray-500 mt-0.5">{item.description}</span>
                )}
              </button>
            ))}
          </div>,
          document.body
        )}

      {/* Empty state - also teleported */}
      {state.isOpen &&
        !state.loading &&
        value.trim().length > 0 &&
        state.options.length === 0 &&
        createPortal(
          <div
            style={dropdownStyle}
            className="rounded-md border border-gray-200 bg-white py-2 px-3 shadow-lg text-sm text-gray-500"
          >
            Không tìm thấy kết quả. Bấm Enter để chọn model mới.
          </div>,
          document.body
        )}
    </div>
  )
}
