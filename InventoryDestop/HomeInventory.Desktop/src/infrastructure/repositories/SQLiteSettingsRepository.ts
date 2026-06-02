import type { Database } from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import type { AppSettingsDto } from '@shared/types/dtos/settings.dto'

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
    return this.getAll()
  }

  getResolvedDataPath(): string {
    const settings = this.getAll()
    if (settings.dataPath && settings.dataPath.trim()) {
      return settings.dataPath.trim()
    }
    return join(app.getPath('userData'), 'Data')
  }

  ensureHoaDonNhapFolder(): string {
    const base = this.getResolvedDataPath()
    const hoaDonNhap = join(base, 'HoaDonNhap')
    if (!existsSync(hoaDonNhap)) {
      mkdirSync(hoaDonNhap, { recursive: true })
    }
    return hoaDonNhap
  }
}
