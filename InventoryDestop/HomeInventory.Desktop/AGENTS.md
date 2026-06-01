# HomeInventory Desktop - AI Agent Guide

## Project Overview

Electron desktop app quản lý kho hàng gia đình.
- **Stack**: Electron + React 19 + TypeScript + SQLite (better-sqlite3)
- **Build tool**: electron-vite
- **UI**: Tailwind CSS v4, lucide-react, recharts
- **Working directory**: `src/` trong `HomeInventory.Desktop/`

## Instruction Files

Đọc các file sau trước khi làm việc:

| File | Nội dung |
|---|---|
| `.opencode/instructions/01-architecture.md` | Clean Architecture, folder structure, dependency rules |
| `.opencode/instructions/02-domain-model.md` | Entities, DTOs, IPC channels, database schema |
| `.opencode/instructions/03-conventions.md` | Naming conventions, code style, file patterns |
| `.opencode/instructions/04-adding-features.md` | Step-by-step guide thêm domain/feature mới |
| `.opencode/instructions/05-frontend-rules.md` | React rules, component patterns, state management |
| `.opencode/instructions/06-database-rules.md` | SQLite rules, migrations, money storage |
| `.opencode/instructions/07-ipc-rules.md` | IPC channel patterns, preload bridge rules |

## Quick Reference

- **Thêm domain mới** → đọc `04-adding-features.md`
- **Sửa UI/component** → đọc `05-frontend-rules.md`
- **Sửa database/migration** → đọc `06-database-rules.md`
- **Sửa IPC/API** → đọc `07-ipc-rules.md`
- **Không chắc về architecture** → đọc `01-architecture.md`
