import type { Database } from 'better-sqlite3'
import type { WarehouseRequestDto, WarehouseResponseDto } from '@shared/types/dtos/warehouse.dto'

interface WarehouseRow {
  id: string
  name: string
  location: string | null
}

function toResponse(row: WarehouseRow): WarehouseResponseDto {
  return {
    id: row.id,
    name: row.name,
    ...(row.location != null ? { location: row.location } : {})
  }
}

// ── WarehouseService ───────────────────────────────────────────────────────
// NOTE: The warehouses table is not yet in 001_init.sql.
// Add a migration (e.g. 002_add_warehouses.sql) before using this service:
//
//   CREATE TABLE IF NOT EXISTS warehouses (
//     id       TEXT PRIMARY KEY,
//     name     TEXT NOT NULL,
//     location TEXT
//   );

export class SQLiteWarehouseRepository {
  constructor(private readonly db: Database) {}

  async getAllAsync(): Promise<WarehouseResponseDto[]> {
    const rows = this.db.prepare<[], WarehouseRow>('SELECT * FROM warehouses ORDER BY name').all()
    return rows.map(toResponse)
  }

  async getByIdAsync(id: string): Promise<WarehouseResponseDto | null> {
    const row = this.db
      .prepare<[string], WarehouseRow>('SELECT * FROM warehouses WHERE id = ?')
      .get(id)
    return row ? toResponse(row) : null
  }

  async createAsync(request: WarehouseRequestDto): Promise<WarehouseResponseDto> {
    const id = crypto.randomUUID()

    this.db
      .prepare<
        [string, string, string | null],
        void
      >('INSERT INTO warehouses (id, name, location) VALUES (?, ?, ?)')
      .run(id, request.name.trim(), request.location ?? null)

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(id: string, request: WarehouseRequestDto): Promise<WarehouseResponseDto> {
    const existing = this.db
      .prepare<[string], WarehouseRow>('SELECT * FROM warehouses WHERE id = ?')
      .get(id)

    if (!existing) {
      throw new Error(`Warehouse with id "${id}" not found.`)
    }

    this.db
      .prepare<
        [string, string | null, string],
        void
      >('UPDATE warehouses SET name = ?, location = ? WHERE id = ?')
      .run(request.name.trim(), request.location ?? null, id)

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const result = this.db.prepare<[string], void>('DELETE FROM warehouses WHERE id = ?').run(id)
    return result.changes > 0
  }
}
