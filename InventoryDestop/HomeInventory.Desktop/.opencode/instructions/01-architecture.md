# 01 - Architecture

## Clean Architecture Layers

Project tuân thủ Clean Architecture với 4 layer rõ ràng:

```
src/
  core/                    # Pure business logic - KHÔNG import Electron/SQLite/React
    repositories/          # Repository interfaces (ports)
    use-cases/             # Use case classes theo từng action
      brands/
      categories/
      products/
      suppliers/
      purchase-orders/
      sales-orders/
      reports/
      shared/

  infrastructure/          # Implementation của external tools
    database/              # SQLite setup, migrations
    repositories/          # SQLite repository implementations
    services/              # Native services (ExcelExportService)

  main/                    # Electron main process
    ipc/                   # IPC handlers - map request → use case
    windows/               # BrowserWindow setup
    utils/
    index.ts               # Bootstrap: openDb → runMigrations → registerIpcHandlers → createMainWindow

  preload/                 # Secure bridge
    api/                   # ipcRenderer.invoke wrappers
    index.ts               # contextBridge.exposeInMainWorld('api', ...)
    index.d.ts             # TypeScript types cho window.api

  renderer/                # React UI
    src/
      pages/
      components/
      lib/
      assets/

  shared/                  # Shared giữa main/preload/renderer
    contracts/             # IPC channel names (single source of truth)
    types/
      dtos/                # Request/Response DTOs
      entities.ts          # Domain entity types
    constants/
    utils/
```

## Dependency Direction

```
renderer → preload → main → infrastructure → core
core ← KHÔNG phụ thuộc bất kỳ layer nào khác
```

**Quy tắc bắt buộc:**
- `core/` KHÔNG được import từ `electron`, `better-sqlite3`, React
- `core/` KHÔNG được import từ `main/`, `preload/`, `renderer/`, `infrastructure/`
- `infrastructure/` implement interfaces định nghĩa trong `core/`
- `main/ipc/` chỉ map IPC → use case, KHÔNG chứa business logic
- `renderer/` gọi `window.api.*`, KHÔNG gọi trực tiếp Node/Electron APIs

## Path Aliases

| Alias | Path |
|---|---|
| `@main/*` | `src/main/*` |
| `@shared/*` | `src/shared/*` |
| `@core/*` | `src/core/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@renderer/*` | `src/renderer/src/*` |
| `@preload/*` | `src/preload/*` |

Aliases được cấu hình trong `electron.vite.config.ts` và `tsconfig.node.json` / `tsconfig.web.json`.

## Entry Points

- **Electron main**: `src/main/index.ts`
- **Preload**: `src/preload/index.ts`
- **Renderer**: `src/renderer/src/main.tsx`
- **Router**: `src/renderer/src/App.tsx` (HashRouter)

## Build & Dev

```bash
npm run dev          # Chạy dev với HMR
npm run build        # typecheck + build
npm run typecheck    # Check cả node và web
npm run lint         # ESLint
```
