import type { Database } from 'better-sqlite3'
import type { SupplierRequestDto, SupplierResponseDto } from '@shared/types/dtos/supplier.dto'

interface SupplierRow {
  id: string
  name: string
  name_normalized: string
  phone: string | null
}

function toResponse(row: SupplierRow): SupplierResponseDto {
  return {
    id: row.id,
    name: row.name,
    ...(row.phone != null ? { phone: row.phone } : {})
  }
}

// ── SupplierService ────────────────────────────────────────────────────────

export class SupplierService {
  constructor(private readonly db: Database) {}

  async getAllAsync(): Promise<SupplierResponseDto[]> {
    const rows = this.db.prepare<[], SupplierRow>('SELECT * FROM suppliers ORDER BY name').all()
    return rows.map(toResponse)
  }

  /** Returns up to `limit` suppliers whose normalized name contains `keyword` */
  async suggestAsync(keyword: string, limit = 10): Promise<SupplierResponseDto[]> {
    const pattern = `%${keyword.trim().toLowerCase()}%`
    const rows = this.db
      .prepare<
        [string, number],
        SupplierRow
      >('SELECT * FROM suppliers WHERE name_normalized LIKE ? ORDER BY name LIMIT ?')
      .all(pattern, limit)
    return rows.map(toResponse)
  }

  async getByIdAsync(id: string): Promise<SupplierResponseDto | null> {
    const row = this.db
      .prepare<[string], SupplierRow>('SELECT * FROM suppliers WHERE id = ?')
      .get(id)
    return row ? toResponse(row) : null
  }

  async createAsync(request: SupplierRequestDto): Promise<SupplierResponseDto> {
    const nameNormalized = request.name.trim().toLowerCase()

    const existing = this.db
      .prepare<[string], { id: string }>('SELECT id FROM suppliers WHERE name_normalized = ?')
      .get(nameNormalized)

    if (existing) {
      throw new Error('Nhà cung cấp đã tồn tại')
    }

    const id = crypto.randomUUID()

    this.db
      .prepare<[string, string, string, string | null], void>(
        `INSERT INTO suppliers (id, name, name_normalized, phone)
         VALUES (?, ?, ?, ?)`
      )
      .run(id, request.name.trim(), nameNormalized, request.phone ?? null)

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(id: string, request: SupplierRequestDto): Promise<SupplierResponseDto> {
    const existing = this.db
      .prepare<[string], SupplierRow>('SELECT * FROM suppliers WHERE id = ?')
      .get(id)

    if (!existing) {
      throw new Error(`Supplier with id "${id}" not found.`)
    }

    const nameNormalized = request.name.trim().toLowerCase()

    const duplicate = this.db
      .prepare<
        [string, string],
        { id: string }
      >('SELECT id FROM suppliers WHERE name_normalized = ? AND id != ?')
      .get(nameNormalized, id)

    if (duplicate) {
      throw new Error('Nhà cung cấp đã tồn tại')
    }

    this.db
      .prepare<[string, string, string | null, string], void>(
        `UPDATE suppliers
         SET name = ?, name_normalized = ?, phone = ?
         WHERE id = ?`
      )
      .run(request.name.trim(), nameNormalized, request.phone ?? null, id)

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const result = this.db.prepare<[string], void>('DELETE FROM suppliers WHERE id = ?').run(id)
    return result.changes > 0
  }
}
