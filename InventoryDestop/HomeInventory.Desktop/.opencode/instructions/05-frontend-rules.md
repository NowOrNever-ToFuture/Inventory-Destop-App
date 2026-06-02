# 05 - Frontend Rules

## React 19 Patterns

### Function Components (KHÔNG dùng forwardRef)

```tsx
// ✅ React 19 - ref as prop
function Input({
  className,
  ref,
  ...props
}: ComponentProps<'input'> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cn('...', className)} {...props} />
}

// ❌ Cũ - forwardRef
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('...', className)} {...props} />
))
```

### Context (KHÔNG dùng useContext)

```tsx
// ✅ React 19
import { use } from 'react'
const ctx = use(ToastContext)

// ❌ Cũ
const ctx = useContext(ToastContext)
```

### State Management

```tsx
// ✅ Lazy init cho computed initial state
const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
const [items, setItems] = useState<Item[]>(() => loadFromStorage())

// ❌ Tính toán mỗi render
const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
```

```tsx
// ✅ useReducer khi ≥4 state liên quan
const [state, dispatch] = useReducer(reducer, initialState)

// ❌ Nhiều useState riêng lẻ
const [loading, setLoading] = useState(false)
const [options, setOptions] = useState([])
const [isOpen, setIsOpen] = useState(false)
const [error, setError] = useState(null)
```

```tsx
// ✅ useCallback cho load functions trong useEffect deps
const loadData = useCallback(async () => {
  const data = await window.api.product.getAll()
  setProducts(data.items)
}, [toast])

useEffect(() => { void loadData() }, [loadData])

// ❌ Function không stable trong deps
const loadData = async () => { ... }
useEffect(() => { void loadData() }, [toast]) // exhaustive-deps warning
```

### Effects

```tsx
// ✅ Không sync state từ prop trong effect
const isEmpty = !value || value.trim().length === 0 // derive inline

// ❌ State synced to prop inside effect
useEffect(() => {
  if (!value) setOptions([]) // ERROR: state synced to prop
}, [value])
```

```tsx
// ✅ Không chain state updates qua effects
const normalized = years.toSorted((a, b) => b - a)
const nextYear = normalized.includes(year) ? year : normalized[0]
setAvailableYears(normalized)
setYear(nextYear) // cùng một event handler

// ❌ Chain qua effects
setAvailableYears(normalized)
// rồi effect khác watch availableYears để setYear
```

## Component Patterns

### Page Components (Smart)

- Gọi `window.api.*` trực tiếp
- Quản lý state loading/error
- Dùng `useToast()` + `reportAppError()` cho error handling
- Dùng `useCallback` cho load functions

```tsx
export function Products() {
  const toast = useToast()
  const [products, setProducts] = useState<ProductResponseDto[]>([])

  const loadProducts = useCallback(async () => {
    try {
      const res = await window.api.product.getList({ page: 1, pageSize: 20 })
      setProducts(res.items)
    } catch (error) {
      reportAppError(toast, 'SP-LOAD-01', 'Không tải được sản phẩm', error)
    }
  }, [toast])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])
  // ...
}
```

### UI Components (Dumb)

- Không gọi `window.api.*`
- Nhận data qua props
- Không có side effects

### Component Folders

```
components/
  ui/           # Primitives: button, input, modal, table, card, badge
  shared/       # App-level reusable: DataTable, FilterBar, ConfirmDialog, SuggestInput, ToastProvider
  layout/       # AppLayout, sidebar
  dashboard/    # Chart components: ImportValueBarChart, TopSupplierBarChart, ...
```

## Styling Rules

```tsx
// ✅ gap-* trên flex/grid
<div className="flex flex-col gap-4">

// ❌ space-y-* trên flex/grid
<div className="flex flex-col space-y-4">

// ✅ size-N khi w và h bằng nhau
<Icon className="size-4" />

// ❌ w-N h-N riêng lẻ
<Icon className="w-4 h-4" />

// ✅ Ellipsis đúng
<span>Đang tải…</span>

// ❌ Ba dấu chấm
<span>Đang tải...</span>
```

## Format Tiền

```tsx
import { formatCurrencyVnd } from '@renderer/lib/format'

// cents là integer (đã nhân 100)
formatCurrencyVnd(10050) // "100,50 ₫"
formatCurrencyVnd(1000000) // "10.000 ₫"
formatCurrencyVnd(0) // "0 ₫"
```

## Accessibility

- Mọi `<label>` phải có `htmlFor` trỏ đến `id` của input
- Mọi `<button>` phải có `type="button"` (trừ submit)
- Mọi interactive control phải có `aria-label` nếu không có visible text
- Dùng `<dialog>` native thay vì `role="dialog"` div

## Intl Performance

```tsx
// ✅ Hoist ra module level
const viVnFormatter = new Intl.NumberFormat('vi-VN')

function MyComponent() {
  return <span>{viVnFormatter.format(value)}</span>
}

// ❌ Tạo mới mỗi render
function MyComponent() {
  return <span>{new Intl.NumberFormat('vi-VN').format(value)}</span>
}
```
