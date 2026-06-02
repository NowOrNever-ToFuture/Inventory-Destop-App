import { app, BrowserWindow, protocol, net } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows/mainWindow'
import { registerIpcHandlers } from './ipc'
import { openDb } from '@infrastructure/database/db'
import { runMigrations } from '@infrastructure/database/migrate'

// Register custom protocol scheme before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-file',
    privileges: {
      bypassCSP: true,
      stream: true,
      supportFetchAPI: true
    }
  }
])

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.homeinventory')

  // Handle local-file:// protocol - serves local files for inline viewing (images, PDFs)
  protocol.handle('local-file', (request) => {
    const path = decodeURIComponent(request.url.slice('local-file://'.length))
    const fileUrl = 'file:///' + path.replace(/^\//, '')
    return net.fetch(fileUrl)
  })

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
