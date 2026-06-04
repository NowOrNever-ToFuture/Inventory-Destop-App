import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import { readAppConfig, getDbPath } from '@infrastructure/services/AppConfigService'

export function openDb(): Database.Database {
  // Read config to check if user chose a custom data path
  const config = readAppConfig()
  const dbPath = getDbPath(config.dataPath)

  // Ensure directory exists
  const dbDir = dbPath.substring(0, dbPath.lastIndexOf('\\'))
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  const db = new Database(dbPath)

  // Enable Write-Ahead Logging for better performance
  db.pragma('journal_mode = WAL')

  return db
}
