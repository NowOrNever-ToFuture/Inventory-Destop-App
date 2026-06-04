import type { Database } from 'better-sqlite3'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { app } from 'electron'
import type { AppSettingsDto } from '@shared/types/dtos/settings.dto'
import { writeAppConfig, readAppConfig } from '@infrastructure/services/AppConfigService'

const DEFAULT_SETTINGS: AppSettingsDto = {
  storeName: 'HomeInventory',
  dataPath: ''
}

export class SQLiteSettingsRepository {
  constructor(private readonly db: Database) {}

  getAll(): AppSettingsDto {
    const rows = this.db
      .prepare<[], { key: string; value: string }>('SELECT key, value FROM app_settings')
      .all()

    const result: AppSettingsDto = { ...DEFAULT_SETTINGS }
    for (const row of rows) {
      if (row.key in result) {
        ;(result as unknown as Record<string, string>)[row.key] = row.value
      }
    }
    return result
  }

  set(key: keyof AppSettingsDto, value: string): AppSettingsDto {
    this.db
      .prepare<[string, string], void>(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      )
      .run(key, value)

    // Khi user đổi dataPath, cập nhật config.json để lần sau openDb() dùng đúng path
    if (key === 'dataPath') {
      writeAppConfig({ dataPath: value })
    }

    return this.getAll()
  }

  getResolvedDataPath(): string {
    // Ưu tiên đọc từ DB (người dùng đã cấu hình)
    const settings = this.getAll()
    if (settings.dataPath && settings.dataPath.trim()) {
      return settings.dataPath.trim()
    }
    // Fallback: đọc từ config.json (trường hợp DB vừa được tạo)
    const config = readAppConfig()
    if (config.dataPath?.trim()) {
      return config.dataPath.trim()
    }
    // Default
    return join(app.getPath('userData'), 'Data')
  }

  ensureHoaDonNhapFolder(): string {
    const settings = this.getAll()
    const base = settings.dataPath?.trim() || readAppConfig().dataPath?.trim() || join(app.getPath('userData'), 'Data')
    const folder = join(base, 'HoaDonNhap')
    if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
    return folder
  }
}
