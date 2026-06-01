import type { Database } from 'better-sqlite3'
import type { CategoryRequestDto, CategoryResponseDto } from '@shared/types/dtos/category.dto'

// ─── Row shape returned by SQLite ─────────────────────────────────────────
interface CategoryRow {
  id: string
  name: string
  name_normalized: string
}

function toResponse(row: CategoryRow): CategoryResponseDto {
  return {
    id: row.id,
    name: row.name
  }
}

// ── CategoryService ────────────────────────────────────────────────────────

export class SQLiteCategoryRepository {
  constructor(private readonly db: Database) {}

  async getAllAsync(): Promise<CategoryResponseDto[]> {
    const rows = this.db.prepare<[], CategoryRow>('SELECT * FROM categories ORDER BY name').all()
    return rows.map(toResponse)
  }

  async getByIdAsync(id: string): Promise<CategoryResponseDto | null> {
    const row = this.db
      .prepare<[string], CategoryRow>('SELECT * FROM categories WHERE id = ?')
      .get(id)
    return row ? toResponse(row) : null
  }

  async createAsync(request: CategoryRequestDto): Promise<CategoryResponseDto> {
    const nameNormalized = request.name.trim().toLowerCase()

    const existing = this.db
      .prepare<[string], { id: string }>('SELECT id FROM categories WHERE name_normalized = ?')
      .get(nameNormalized)

    if (existing) {
      throw new Error('Danh mục đã tồn tại')
    }

    const id = crypto.randomUUID()

    this.db
      .prepare<
        [string, string, string],
        void
      >('INSERT INTO categories (id, name, name_normalized) VALUES (?, ?, ?)')
      .run(id, request.name.trim(), nameNormalized)

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(id: string, request: CategoryRequestDto): Promise<CategoryResponseDto> {
    const existing = this.db
      .prepare<[string], CategoryRow>('SELECT * FROM categories WHERE id = ?')
      .get(id)

    if (!existing) {
      throw new Error(`Category with id "${id}" not found.`)
    }

    const nameNormalized = request.name.trim().toLowerCase()

    // Duplicate check: another row with same normalized name
    const duplicate = this.db
      .prepare<
        [string, string],
        { id: string }
      >('SELECT id FROM categories WHERE name_normalized = ? AND id != ?')
      .get(nameNormalized, id)

    if (duplicate) {
      throw new Error('Danh mục đã tồn tại')
    }

    this.db
      .prepare<
        [string, string, string],
        void
      >('UPDATE categories SET name = ?, name_normalized = ? WHERE id = ?')
      .run(request.name.trim(), nameNormalized, id)

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const result = this.db.prepare<[string], void>('DELETE FROM categories WHERE id = ?').run(id)
    return result.changes > 0
  }
}
