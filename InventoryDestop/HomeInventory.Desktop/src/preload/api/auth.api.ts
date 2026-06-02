import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'

export const authApi = {
  checkSetup: (): Promise<{ setupComplete: boolean }> =>
    ipcRenderer.invoke(IpcChannels.AUTH_CHECK_SETUP),

  login: (username: string, password: string): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke(IpcChannels.AUTH_LOGIN, username, password),

  changePassword: (
    username: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke(IpcChannels.AUTH_CHANGE_PASSWORD, username, currentPassword, newPassword),

  setup: (
    username: string,
    password: string,
    storeName: string,
    dataPath: string
  ): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke(IpcChannels.AUTH_SETUP, username, password, storeName, dataPath)
}

export type AuthApi = typeof authApi
