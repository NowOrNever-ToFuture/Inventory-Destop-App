import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { dialog, shell } from 'electron'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { AppSettingsDto, AppSettingUpdateDto } from '@shared/types/dtos/settings.dto'
import { SQLiteSettingsRepository } from '@infrastructure/repositories/SQLiteSettingsRepository'

export function registerSettingsHandlers(ipcMain: IpcMain, db: Database): void {
  const repo = new SQLiteSettingsRepository(db)

  ipcMain.handle(IpcChannels.SETTINGS_GET_ALL, (): AppSettingsDto => {
    return repo.getAll()
  })

  ipcMain.handle(
    IpcChannels.SETTINGS_SET,
    (_event, update: AppSettingUpdateDto): AppSettingsDto => {
      return repo.set(update.key, update.value)
    }
  )

  ipcMain.handle(IpcChannels.SETTINGS_GET_DATA_PATH, (): string => {
    return repo.getResolvedDataPath()
  })

  ipcMain.handle(IpcChannels.SETTINGS_OPEN_FOLDER_PICKER, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Chọn thư mục lưu dữ liệu',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle(
    IpcChannels.FILE_SAVE_ATTACHMENT,
    (_event, sourcePath: string, orderId: string): string | null => {
      try {
        if (!sourcePath || !existsSync(sourcePath)) return null
        const folder = repo.ensureHoaDonNhapFolder()
        const ext = extname(sourcePath)
        const filename = `${orderId}${ext}`
        const dest = join(folder, filename)
        copyFileSync(sourcePath, dest)
        return dest
      } catch {
        return null
      }
    }
  )

  ipcMain.handle(IpcChannels.FILE_OPEN, (_event, filePath: string): boolean => {
    if (!filePath || !existsSync(filePath)) return false
    void shell.openPath(filePath)
    return true
  })

  ipcMain.handle(IpcChannels.FILE_PICK_ATTACHMENT, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      title: 'Chọn hoá đơn đính kèm',
      filters: [{ name: 'Ảnh & PDF', extensions: ['png', 'jpg', 'jpeg', 'pdf'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  // Read attachment file as base64 data URL for preview
  ipcMain.handle(IpcChannels.FILE_READ_ATTACHMENT, (_event, filePath: string): string | null => {
    try {
      if (!filePath || !existsSync(filePath)) return null
      const ext = extname(filePath).toLowerCase()
      const mime =
        ext === '.pdf'
          ? 'application/pdf'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : ext === '.png'
              ? 'image/png'
              : 'application/octet-stream'
      const data = readFileSync(filePath)
      const base64 = data.toString('base64')
      return `data:${mime};base64,${base64}`
    } catch {
      return null
    }
  })
}
