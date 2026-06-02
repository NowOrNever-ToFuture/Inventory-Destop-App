import * as React from 'react'
import { Search } from 'lucide-react'

interface FilterBarProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  actions?: React.ReactNode
}

export function FilterBar({
  searchPlaceholder = 'Tìm kiếm...',
  searchValue,
  onSearchChange,
  actions
}: FilterBarProps) {
  return (
    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-lg">
      <div className="flex items-center gap-3 w-1/2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">{actions}</div>
    </div>
  )
}
