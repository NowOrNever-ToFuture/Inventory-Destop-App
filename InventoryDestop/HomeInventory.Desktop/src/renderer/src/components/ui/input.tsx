import * as React from 'react'
import { cn } from '@renderer/lib/utils'
import { clampNumberString, limitWords } from '@renderer/lib/input-sanitize'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, ...props }, ref) => {
    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const el = e.currentTarget

      if (type === 'number') {
        const next = clampNumberString(el.value)
        if (next !== el.value) el.value = next
      }

      if (type === undefined || type === 'text' || type === 'search') {
        const next = limitWords(el.value)
        if (next !== el.value) el.value = next
      }

      onChange?.(e)
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
