import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

export interface AppConfig {
  dataPath?: string
  storeName?: string
}

const CONFIG_FILE = 'app-config.json'

function getConfigPath(): string {
  return join(app.getPath('userData'), CONFIG_FILE)
}

export function readAppConfig(): AppConfig {
  try {
    const configPath = getConfigPath()
    if (!existsSync(configPath)) {
      // Legacy: check for installer-config.json at resources parent dir
      const legacyPath = join(app.getPath('userData'), '..', 'installer-config.json')
      if (existsSync(legacyPath)) {
        const data = readFileSync(legacyPath, 'utf-8')
        return JSON.parse(data) as AppConfig
      }
      return {}
    }
    const data = readFileSync(configPath, 'utf-8')
    return JSON.parse(data) as AppConfig
  } catch {
    return {}
  }
}

export function writeAppConfig(config: AppConfig): void {
  const existing = readAppConfig()
  const merged = { ...existing, ...config }
  const configPath = getConfigPath()
  const dir = join(configPath, '..')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8')
}

export function getDbPath(dataPath?: string): string {
  if (dataPath && dataPath.trim()) {
    const p = dataPath.trim()
    if (!existsSync(p)) mkdirSync(p, { recursive: true })
    return join(p, 'homeinventory.sqlite')
  }
  // Default: userData/database
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'database')
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })
  return join(dbDir, 'homeinventory.sqlite')
}

export function getHoaDonNhapPath(dataPath?: string): string {
  const base = dataPath && dataPath.trim()
    ? dataPath.trim()
    : join(app.getPath('userData'), 'Data')
  const folder = join(base, 'HoaDonNhap')
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
  return folder
}
