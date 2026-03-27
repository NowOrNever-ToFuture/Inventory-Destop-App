import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows/mainWindow'
import { registerIpcHandlers } from './ipc'
import { openDb } from './database/db'
import { runMigrations } from './database/migrate'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.homeinventory')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database
  const db = openDb()
  runMigrations(db)

  // Register all IPC handlers
  registerIpcHandlers(db)

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

