import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import { AuthService } from '@infrastructure/services/AuthService'
import { SQLiteSettingsRepository } from '@infrastructure/repositories/SQLiteSettingsRepository'

export function registerAuthHandlers(ipcMain: IpcMain, db: Database): void {
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
      const result = auth.setupAdmin(username, password)
      if (!result.success) return result

      const settings = new SQLiteSettingsRepository(db)
      if (storeName.trim()) settings.set('storeName', storeName.trim())
      if (dataPath.trim()) settings.set('dataPath', dataPath.trim())

      return { success: true }
    }
  )
}
