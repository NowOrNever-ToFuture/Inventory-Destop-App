# 07 - IPC Rules

## Luồng IPC

```
Renderer (window.api.product.getAll())
  → Preload (ipcRenderer.invoke('product:getAll', query))
  → Main IPC Handler (ipcMain.handle('product:getAll', ...))
  → Use Case (ProductUseCases.getAllAsync(query))
  → SQLite Repository (SQLiteProductRepository.getAllAsync(query))
  → SQLite DB
  → Response ngược lại
```

## IPC Channel Naming

- Single source of truth: `src/shared/contracts/ipc-channels.ts`
- Pattern: `'domain:action'` (camelCase domain, camelCase action)
- Constant name: `DOMAIN_ACTION` (UPPER_SNAKE_CASE)

```ts
// ✅ Đúng
PRODUCT_GET_ALL: 'product:getAll'
PURCHASE_ORDER_CREATE: 'purchaseOrder:create'
REPORT_TOP_SUPPLIERS: 'report:topSuppliers'
EXPORT_PURCHASE_REPORT: 'export:purchaseReport'

// ❌ Sai
PRODUCT_GETALL: 'product/getAll'
PURCHASE_ORDER_CREATE: 'PurchaseOrder:Create'
```

## IPC Handler Pattern

```ts
// src/main/ipc/product.handlers.ts
import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { ProductRequestDto, ProductResponseDto } from '@shared/types/dtos/product.dto'
import { ProductUseCases } from '@core/use-cases'
import { SQLiteProductRepository } from '@infrastructure/repositories'

export function registerProductHandlers(ipcMain: IpcMain, db: Database): void {
  // Inject repository vào use case
  const service = new ProductUseCases(new SQLiteProductRepository(db))

  ipcMain.handle(
    IpcChannels.PRODUCT_GET_ALL,
    async (_event, query?: ProductGetAllQueryDto): Promise<ProductGetAllResponseDto> => {
      return service.getAllAsync(query)
    }
  )

  ipcMain.handle(
    IpcChannels.PRODUCT_CREATE,
    async (_event, data: ProductRequestDto): Promise<ProductResponseDto> => {
      return service.createAsync(data)
    }
  )
}
```

**Quy tắc IPC Handler:**

- KHÔNG chứa business logic
- KHÔNG query SQLite trực tiếp (trừ trường hợp đặc biệt như report inline queries)
- Chỉ map IPC request → use case method → return response
- Luôn type return type của handler

## Preload API Pattern

```ts
// src/preload/api/product.api.ts
import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { ProductRequestDto, ProductResponseDto } from '@shared/types/dtos/product.dto'

export const productApi = {
  getAll: (query?: ProductGetAllQueryDto): Promise<ProductGetAllResponseDto> =>
    ipcRenderer.invoke(IpcChannels.PRODUCT_GET_ALL, query),

  create: (data: ProductRequestDto): Promise<ProductResponseDto> =>
    ipcRenderer.invoke(IpcChannels.PRODUCT_CREATE, data),

  update: (id: string, data: ProductRequestDto): Promise<ProductResponseDto> =>
    ipcRenderer.invoke(IpcChannels.PRODUCT_UPDATE, id, data),

  delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.PRODUCT_DELETE, id)
}

export type ProductApi = typeof productApi
```

## Preload Index Registration

Mỗi API mới phải được đăng ký trong `src/preload/index.ts`:

```ts
import { warehouseApi } from './api/warehouse.api'

const api = {
  // ... existing
  warehouse: warehouseApi
}
```

Và type declaration trong `src/preload/index.d.ts`:

```ts
import type { WarehouseApi } from './api/warehouse.api'

interface DesktopApi {
  // ... existing
  warehouse: WarehouseApi
}
```

## Context Bridge Security

- `contextBridge.exposeInMainWorld('api', api)` - expose qua `window.api`
- `contextBridge.exposeInMainWorld('electron', electronAPI)` - expose electron utilities
- KHÔNG expose Node.js APIs trực tiếp ra renderer
- `sandbox: false` trong BrowserWindow (cần review nếu tăng security)

## Error Handling trong IPC

Errors thrown trong handler sẽ được serialize và re-thrown ở renderer:

```ts
// Main - throw Error với message tiếng Việt
if (!existing) throw new Error('Sản phẩm không tồn tại')

// Renderer - catch và hiển thị
try {
  await window.api.product.delete(id)
} catch (error) {
  reportAppError(toast, 'SP-DEL-01', 'Không xóa được sản phẩm', error)
}
```

`reportAppError` tại `src/renderer/src/lib/app-error.ts` - hiển thị error message qua toast.

## IPC Handler Registration

Tất cả handlers được register trong `src/main/ipc/index.ts`:

```ts
export function registerIpcHandlers(db: Database): void {
  registerProductHandlers(ipcMain, db)
  registerCategoryHandlers(ipcMain, db)
  registerBrandHandlers(ipcMain, db)
  registerSupplierHandlers(ipcMain, db)
  registerPurchaseOrderHandlers(ipcMain, db)
  registerSalesOrderHandlers(ipcMain, db)
  registerReportHandlers(ipcMain, db)
  registerExportHandlers(ipcMain, db)
  // Thêm handler mới ở đây
}
```

## Renderer Usage

```tsx
// Gọi API từ renderer
const products = await window.api.product.getAll({ page: 1, pageSize: 20 })

// TypeScript biết type nhờ window.api: DesktopApi trong index.d.ts
window.api.product.create(data) // → Promise<ProductResponseDto>
window.api.export.exportPurchaseReport(2025) // → Promise<string | null>
```
