import { randomBytes, pbkdf2Sync } from 'node:crypto'

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
import type { Database } from 'better-sqlite3'

interface UserRow {
  id: string
  username: string
  password_hash: string
  salt: string
}

const ITERATIONS = 100000
const KEY_LENGTH = 64
const DIGEST = 'sha512'

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
}

export class AuthService {
  constructor(private readonly db: Database) {}

  isSetupComplete(): boolean {
    const row = this.db
      .prepare<[], { value: string }>("SELECT value FROM app_settings WHERE key = 'setup_complete'")
      .get()
    return row?.value === 'true'
  }

  markSetupComplete(): void {
    this.db
      .prepare(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ('setup_complete', 'true', datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = datetime('now')`
      )
      .run()
  }

  login(username: string, password: string): { success: boolean; message?: string } {
    const user = this.db
      .prepare<[string], UserRow>('SELECT * FROM users WHERE username = ?')
      .get(username.trim().toLowerCase())

    if (!user) {
      return { success: false, message: 'Tên đăng nhập không tồn tại.' }
    }

    const hash = hashPassword(password, user.salt)
    if (hash !== user.password_hash) {
      return { success: false, message: 'Mật khẩu không đúng.' }
    }

    return { success: true }
  }

  changePassword(
    username: string,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message?: string } {
    const user = this.db
      .prepare<[string], UserRow>('SELECT * FROM users WHERE username = ?')
      .get(username.trim().toLowerCase())

    if (!user) {
      return { success: false, message: 'Người dùng không tồn tại.' }
    }

    const hash = hashPassword(currentPassword, user.salt)
    if (hash !== user.password_hash) {
      return { success: false, message: 'Mật khẩu hiện tại không đúng.' }
    }

    if (newPassword.length < 4) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự.' }
    }

    const newSalt = randomBytes(16).toString('hex')
    const newHash = hashPassword(newPassword, newSalt)

    this.db
      .prepare(
        "UPDATE users SET password_hash = ?, salt = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .run(newHash, newSalt, user.id)

    return { success: true }
  }

  setupAdmin(username: string, password: string): { success: boolean; message?: string } {
    if (!username.trim() || password.length < 4) {
      return { success: false, message: 'Tên đăng nhập và mật khẩu (ít nhất 4 ký tự) là bắt buộc.' }
    }

    const existing = this.db
      .prepare<[string], UserRow>('SELECT id FROM users WHERE username = ?')
      .get(username.trim().toLowerCase())

    if (existing) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại.' }
    }

    const id = generateId()
    const salt = randomBytes(16).toString('hex')
    const hash = hashPassword(password, salt)

    this.db
      .prepare('INSERT INTO users (id, username, password_hash, salt) VALUES (?, ?, ?, ?)')
      .run(id, username.trim().toLowerCase(), hash, salt)

    this.markSetupComplete()
    return { success: true }
  }
}
