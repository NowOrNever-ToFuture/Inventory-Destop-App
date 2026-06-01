import type { Database } from 'better-sqlite3'
import type { BrandRequestDto, BrandResponseDto } from '@shared/types/dtos/brand.dto'

interface BrandRow {
  id: string
  name: string
  name_normalized: string
}

function toResponse(row: BrandRow): BrandResponseDto {
  return { id: row.id, name: row.name }
}

// ── BrandService ───────────────────────────────────────────────────────────

export class SQLiteBrandRepository {
  constructor(private readonly db: Database) {}

  async getAllAsync(): Promise<BrandResponseDto[]> {
    const rows = this.db.prepare<[], BrandRow>('SELECT * FROM brands ORDER BY name').all()
    return rows.map(toResponse)
  }

  /** Returns up to `limit` brand names whose normalized name contains `keyword` */
  async suggestAsync(keyword: string, limit = 10): Promise<string[]> {
    const pattern = `%${keyword.trim().toLowerCase()}%`
    const rows = this.db
      .prepare<
        [string, number],
        Pick<BrandRow, 'name'>
      >('SELECT name FROM brands WHERE name_normalized LIKE ? ORDER BY name LIMIT ?')
      .all(pattern, limit)
    return rows.map((r) => r.name)
  }

  async getByIdAsync(id: string): Promise<BrandResponseDto | null> {
    const row = this.db.prepare<[string], BrandRow>('SELECT * FROM brands WHERE id = ?').get(id)
    return row ? toResponse(row) : null
  }

  async createAsync(request: BrandRequestDto): Promise<BrandResponseDto> {
    const nameNormalized = request.name.trim().toLowerCase()

    const existing = this.db
      .prepare<[string], { id: string }>('SELECT id FROM brands WHERE name_normalized = ?')
      .get(nameNormalized)

    if (existing) {
      throw new Error('Hãng đã tồn tại')
    }

    const id = crypto.randomUUID()

    this.db
      .prepare<
        [string, string, string],
        void
      >('INSERT INTO brands (id, name, name_normalized) VALUES (?, ?, ?)')
      .run(id, request.name.trim(), nameNormalized)

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(id: string, request: BrandRequestDto): Promise<BrandResponseDto> {
    const existing = this.db
      .prepare<[string], BrandRow>('SELECT * FROM brands WHERE id = ?')
      .get(id)

    if (!existing) {
      throw new Error(`Brand with id "${id}" not found.`)
    }

    const nameNormalized = request.name.trim().toLowerCase()

    const duplicate = this.db
      .prepare<
        [string, string],
        { id: string }
      >('SELECT id FROM brands WHERE name_normalized = ? AND id != ?')
      .get(nameNormalized, id)

    if (duplicate) {
      throw new Error('Hãng đã tồn tại')
    }

    this.db
      .prepare<
        [string, string, string],
        void
      >('UPDATE brands SET name = ?, name_normalized = ? WHERE id = ?')
      .run(request.name.trim(), nameNormalized, id)

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const result = this.db.prepare<[string], void>('DELETE FROM brands WHERE id = ?').run(id)
    return result.changes > 0
  }
}
