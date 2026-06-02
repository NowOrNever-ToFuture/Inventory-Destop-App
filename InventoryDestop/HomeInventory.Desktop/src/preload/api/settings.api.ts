import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { AppSettingsDto, AppSettingUpdateDto } from '@shared/types/dtos/settings.dto'

export const settingsApi = {
  getAll: (): Promise<AppSettingsDto> => ipcRenderer.invoke(IpcChannels.SETTINGS_GET_ALL),

  set: (update: AppSettingUpdateDto): Promise<AppSettingsDto> =>
    ipcRenderer.invoke(IpcChannels.SETTINGS_SET, update),

  getDataPath: (): Promise<string> => ipcRenderer.invoke(IpcChannels.SETTINGS_GET_DATA_PATH),

  openFolderPicker: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.SETTINGS_OPEN_FOLDER_PICKER)
}

export const fileApi = {
  pickAttachment: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.FILE_PICK_ATTACHMENT),

  saveAttachment: (sourcePath: string, orderId: string): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.FILE_SAVE_ATTACHMENT, sourcePath, orderId),

  open: (filePath: string): Promise<boolean> => ipcRenderer.invoke(IpcChannels.FILE_OPEN, filePath),

  readAttachment: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.FILE_READ_ATTACHMENT, filePath)
}

export type SettingsApi = typeof settingsApi
export type FileApi = typeof fileApi
