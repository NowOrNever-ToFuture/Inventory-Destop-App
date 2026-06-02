# 04 - Adding Features

## Checklist thêm domain mới (ví dụ: `Warehouse`)

Thực hiện theo thứ tự sau để đảm bảo đúng Clean Architecture:

### Bước 1: Shared - DTO

Tạo `src/shared/types/dtos/warehouse.dto.ts`:

```ts
export interface WarehouseRequestDto {
  name: string
  location?: string
}

export interface WarehouseResponseDto {
  id: string
  name: string
  location?: string
}
```

Export từ `src/shared/types/dtos/index.ts`.

### Bước 2: Shared - IPC Channels

Thêm vào `src/shared/contracts/ipc-channels.ts`:

```ts
WAREHOUSE_GET_ALL: 'warehouse:getAll',
WAREHOUSE_CREATE: 'warehouse:create',
WAREHOUSE_UPDATE: 'warehouse:update',
WAREHOUSE_DELETE: 'warehouse:delete',
```

### Bước 3: Core - Repository Interface

Thêm vào `src/core/repositories/index.ts`:

```ts
export type WarehouseRepository = RepositoryPort
```

### Bước 4: Core - Use Cases

Tạo folder `src/core/use-cases/warehouses/` với các files:

```
GetAllWarehouseUseCase.ts
GetByIdWarehouseUseCase.ts
CreateWarehouseUseCase.ts
UpdateWarehouseUseCase.ts
DeleteWarehouseUseCase.ts
index.ts
```

Pattern mỗi file:

```ts
import type { WarehouseRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class CreateWarehouseUseCase extends RepositoryUseCase<WarehouseRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.createAsync(...args)
  }
}
```

Thêm `WarehouseUseCases` facade vào `src/core/use-cases/index.ts`:

```ts
import { CreateWarehouseUseCase } from './warehouses/CreateWarehouseUseCase'
// ... các imports khác

export class WarehouseUseCases extends CrudUseCases {
  constructor(repository: WarehouseRepository) {
    super(
      new GetAllWarehouseUseCase(repository),
      new GetByIdWarehouseUseCase(repository),
      new CreateWarehouseUseCase(repository),
      new UpdateWarehouseUseCase(repository),
      new DeleteWarehouseUseCase(repository)
    )
  }
}

export * from './warehouses'
```

### Bước 5: Infrastructure - SQLite Repository

Tạo `src/infrastructure/repositories/SQLiteWarehouseRepository.ts`:

```ts
import type { Database } from 'better-sqlite3'
import type { WarehouseRequestDto, WarehouseResponseDto } from '@shared/types/dtos/warehouse.dto'

export class SQLiteWarehouseRepository {
  constructor(private readonly db: Database) {}

  async getAllAsync(): Promise<WarehouseResponseDto[]> { ... }
  async getByIdAsync(id: string): Promise<WarehouseResponseDto | null> { ... }
  async createAsync(request: WarehouseRequestDto): Promise<WarehouseResponseDto> { ... }
  async updateAsync(id: string, request: WarehouseRequestDto): Promise<WarehouseResponseDto> { ... }
  async deleteAsync(id: string): Promise<boolean> { ... }
}
```

Export từ `src/infrastructure/repositories/index.ts`.

### Bước 6: Main - IPC Handler

Tạo `src/main/ipc/warehouse.handlers.ts`:

```ts
import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { WarehouseRequestDto, WarehouseResponseDto } from '@shared/types/dtos/warehouse.dto'
import { WarehouseUseCases } from '@core/use-cases'
import { SQLiteWarehouseRepository } from '@infrastructure/repositories'

export function registerWarehouseHandlers(ipcMain: IpcMain, db: Database): void {
  const service = new WarehouseUseCases(new SQLiteWarehouseRepository(db))

  ipcMain.handle(IpcChannels.WAREHOUSE_GET_ALL, async (): Promise<WarehouseResponseDto[]> => {
    return service.getAllAsync()
  })
  // ... các handlers khác
}
```

Register trong `src/main/ipc/index.ts`:

```ts
import { registerWarehouseHandlers } from './warehouse.handlers'

export function registerIpcHandlers(db: Database): void {
  // ... existing handlers
  registerWarehouseHandlers(ipcMain, db)
}
```

### Bước 7: Preload - API Bridge

Tạo `src/preload/api/warehouse.api.ts`:

```ts
import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { WarehouseRequestDto, WarehouseResponseDto } from '@shared/types/dtos/warehouse.dto'

export const warehouseApi = {
  getAll: (): Promise<WarehouseResponseDto[]> => ipcRenderer.invoke(IpcChannels.WAREHOUSE_GET_ALL),
  create: (data: WarehouseRequestDto): Promise<WarehouseResponseDto> =>
    ipcRenderer.invoke(IpcChannels.WAREHOUSE_CREATE, data),
  update: (id: string, data: WarehouseRequestDto): Promise<WarehouseResponseDto> =>
    ipcRenderer.invoke(IpcChannels.WAREHOUSE_UPDATE, id, data),
  delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.WAREHOUSE_DELETE, id)
}

export type WarehouseApi = typeof warehouseApi
```

Thêm vào `src/preload/index.ts`:

```ts
import { warehouseApi } from './api/warehouse.api'

const api = {
  // ... existing apis
  warehouse: warehouseApi
}
```

Thêm vào `src/preload/index.d.ts`:

```ts
import type { WarehouseApi } from './api/warehouse.api'

interface DesktopApi {
  // ... existing apis
  warehouse: WarehouseApi
}
```

### Bước 8: Renderer - Page & Route

Tạo `src/renderer/src/pages/Warehouses.tsx`.

Thêm route vào `src/renderer/src/App.tsx`:

```tsx
import { Warehouses } from './pages/Warehouses'

;<Route path="warehouses" element={<Warehouses />} />
```

Thêm nav item vào `src/renderer/src/components/layout/AppLayout.tsx`.

### Bước 9: Database Migration (nếu cần)

Tạo `src/infrastructure/database/migrations/004_add_warehouses.sql`.

Migration tự động chạy khi app khởi động.

### Bước 10: Verify

```bash
npm run typecheck
npm run dev
```

## Thêm Report/Chart mới

1. Thêm method vào `SQLiteReportRepository`
2. Thêm use case vào `src/core/use-cases/reports/`
3. Thêm method vào `ReportUseCases` facade trong `src/core/use-cases/index.ts`
4. Thêm IPC channel + handler trong `report.handlers.ts`
5. Thêm preload API trong `report.api.ts`
6. Tạo chart component trong `src/renderer/src/components/dashboard/`
7. Dùng trong `Dashboard.tsx`

## Thêm Excel Export mới

1. Thêm method vào `src/infrastructure/services/ExcelExportService.ts`
2. Thêm IPC channel trong `ipc-channels.ts`
3. Thêm handler trong `src/main/ipc/export.handlers.ts`
4. Thêm preload API trong `src/preload/api/export.api.ts`
5. Gọi từ renderer: `window.api.export.exportXxx(year)`
