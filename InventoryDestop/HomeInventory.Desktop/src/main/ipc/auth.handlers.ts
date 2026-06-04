import type { IpcMain } from 'electron'
import type { Database as SqliteDb } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import { AuthService } from '@infrastructure/services/AuthService'
import { SQLiteSettingsRepository } from '@infrastructure/repositories/SQLiteSettingsRepository'
import { writeAppConfig, getDbPath } from '@infrastructure/services/AppConfigService'
import { runMigrations } from '@infrastructure/database/migrate'

export function registerAuthHandlers(ipcMain: IpcMain, db: SqliteDb): void {
  const auth = new AuthService(db)

  ipcMain.handle(IpcChannels.AUTH_CHECK_SETUP, (): { setupComplete: boolean } => {
    return { setupComplete: auth.isSetupComplete() }
  })

  ipcMain.handle(
    IpcChannels.AUTH_LOGIN,
    (_event, username: string, password: string): { success: boolean; message?: string } => {
      return auth.login(username, password)
    }
  )

  ipcMain.handle(
    IpcChannels.AUTH_CHANGE_PASSWORD,
    (
      _event,
      username: string,
      currentPassword: string,
      newPassword: string
    ): { success: boolean; message?: string } => {
      return auth.changePassword(username, currentPassword, newPassword)
    }
  )

  ipcMain.handle(
    IpcChannels.AUTH_SETUP,
    (
      _event,
      username: string,
      password: string,
      storeName: string,
      dataPath: string
    ): { success: boolean; message?: string } => {
      // 1. Ghi config.json trước (để lần sau openDb() dùng đúng path)
      if (dataPath.trim()) writeAppConfig({ dataPath: dataPath.trim() })
      if (storeName.trim()) writeAppConfig({ storeName: storeName.trim() })

      // 2. Nếu user chọn dataPath khác, tạo DB mới tại đó
      let targetDb: SqliteDb | null = null
      let targetAuth: AuthService

      if (dataPath.trim()) {
        // Mở DB mới tại dataPath user chọn
        const newDbPath = getDbPath(dataPath.trim())
        const BetterSqlite3 = require('better-sqlite3')
        targetDb = new BetterSqlite3(newDbPath) as SqliteDb
        targetDb.pragma('journal_mode = WAL')

        // Run migrations on the new DB
        runMigrations(targetDb)

        targetAuth = new AuthService(targetDb)
      } else {
        targetDb = null
        targetAuth = auth
      }

      // 3. Tạo admin user trên DB đích
      const result = targetAuth.setupAdmin(username, password)
      if (!result.success) {
        if (targetDb) targetDb.close()
        return result
      }

      // 4. Lưu storeName và dataPath vào DB đích
      const settingsRepo = targetDb
        ? new SQLiteSettingsRepository(targetDb)
        : new SQLiteSettingsRepository(db)
      if (storeName.trim()) settingsRepo.set('storeName', storeName.trim())
      if (dataPath.trim()) settingsRepo.set('dataPath', dataPath.trim())

      // Đóng DB tạm nếu khác DB chính
      if (targetDb) targetDb.close()

      return { success: true }
    }
  )
}
