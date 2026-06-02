# 03 - Conventions

## Naming Conventions

### Files

| Loại                     | Pattern                       | Ví dụ                                               |
| ------------------------ | ----------------------------- | --------------------------------------------------- |
| Service/Repository class | PascalCase                    | `ProductService.ts`, `SQLiteProductRepository.ts`   |
| IPC handler              | `<domain>.handlers.ts`        | `product.handlers.ts`, `purchase-order.handlers.ts` |
| Preload API              | `<domain>.api.ts`             | `product.api.ts`, `purchase-order.api.ts`           |
| DTO                      | `<domain>.dto.ts`             | `product.dto.ts`, `sales-order.dto.ts`              |
| React page               | PascalCase                    | `Products.tsx`, `PurchaseOrder.tsx`                 |
| React component          | PascalCase                    | `DataTable.tsx`, `ConfirmDialog.tsx`                |
| UI primitive             | PascalCase                    | `button.tsx`, `input.tsx`, `modal.tsx`              |
| Use case                 | `<Action><Domain>UseCase.ts`  | `CreateProductUseCase.ts`, `GetAllBrandUseCase.ts`  |
| SQLite repository        | `SQLite<Domain>Repository.ts` | `SQLiteProductRepository.ts`                        |

### Classes & Interfaces

| Loại                 | Pattern                     | Ví dụ                      |
| -------------------- | --------------------------- | -------------------------- |
| Repository interface | `<Domain>Repository`        | `ProductRepository`        |
| Use case class       | `<Action><Domain>UseCase`   | `CreateProductUseCase`     |
| SQLite repository    | `SQLite<Domain>Repository`  | `SQLiteProductRepository`  |
| Use case facade      | `<Domain>UseCases`          | `ProductUseCases`          |
| DTO request          | `<Domain>RequestDto`        | `ProductRequestDto`        |
| DTO response         | `<Domain>ResponseDto`       | `ProductResponseDto`       |
| DTO query            | `<Domain>GetAllQueryDto`    | `ProductGetAllQueryDto`    |
| DTO list response    | `<Domain>GetAllResponseDto` | `ProductGetAllResponseDto` |

### IPC Channels

```ts
// Pattern: 'domain:action' (camelCase domain, camelCase action)
'product:getAll'
'purchaseOrder:create'
'report:topSuppliers'
```

### Constants

```ts
// UPPER_SNAKE_CASE
IpcChannels.PRODUCT_GET_ALL
MAX_MONEY
MONEY_SCALE
```

## Code Style

### TypeScript

- Dùng `type` cho union/intersection, `interface` cho object shapes
- Không dùng `any` trừ khi thực sự cần (use case facades dùng `any` là chấp nhận được)
- Luôn type return của async functions
- Dùng `readonly` cho constructor params trong services/repositories

```ts
// ✅ Đúng
export class SQLiteProductRepository {
  constructor(private readonly db: Database) {}
}

// ❌ Sai
export class SQLiteProductRepository {
  constructor(private db: any) {}
}
```

### React (React 19)

- Dùng plain function components, KHÔNG dùng `React.forwardRef` (React 19 hỗ trợ ref as prop)
- Dùng `use()` thay vì `useContext()` (React 19)
- Hoist `new Intl.NumberFormat(...)` ra module level, KHÔNG tạo trong render
- Dùng `useReducer` khi có ≥4 state liên quan
- Dùng `useCallback` cho load functions được dùng trong `useEffect` deps
- Dùng lazy init cho `useState` với giá trị tính toán: `useState(() => ...)`
- Dùng `arr.toSorted()` thay vì `[...arr].sort()`
- Dùng `gap-*` thay vì `space-y-*` / `space-x-*` trên flex/grid containers
- Dùng `size-N` thay vì `w-N h-N` khi cả hai bằng nhau (Tailwind v3.4+)
- Dùng `…` thay vì `...` trong text UI

### Prettier Config (`.prettierrc.yaml`)

- Single quotes
- No semicolons (trừ một số file dùng semicolons - match file hiện tại)
- 2 spaces indent

## Import Order

```ts
// 1. Node built-ins
import { join } from 'node:path'

// 2. External packages
import { app } from 'electron'
import type { Database } from 'better-sqlite3'

// 3. Internal aliases (@core, @shared, @main, @infrastructure, @renderer)
import { IpcChannels } from '@shared/contracts/ipc-channels'
import { ProductUseCases } from '@core/use-cases'

// 4. Relative imports
import { formatCurrencyVnd } from '../lib/format'
```

## Error Messages

- Tiếng Việt cho user-facing errors: `'Sản phẩm đã tồn tại'`
- Tiếng Anh cho developer errors: `'Product with id "${id}" not found.'`
