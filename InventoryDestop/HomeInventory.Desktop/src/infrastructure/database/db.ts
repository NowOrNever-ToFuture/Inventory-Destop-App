import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

export function openDb(): Database.Database {
  // Store database in the app's userData directory
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'database')
  
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  
  const dbPath = join(dbDir, 'homeinventory.sqlite')
  const db = new Database(dbPath)
  
  // Enable Write-Ahead Logging for better performance
  db.pragma('journal_mode = WAL')
  
  return db
}
