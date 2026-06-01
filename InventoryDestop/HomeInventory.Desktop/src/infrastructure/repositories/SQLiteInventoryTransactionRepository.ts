import type { Database } from 'better-sqlite3'
import type {
  InventoryTransactionRequestDto,
  InventoryTransactionResponseDto
} from '@shared/types/dtos/inventory-transaction.dto'

interface InventoryTransactionRow {
  id: string
  product_id: string
  warehouse_id: string
  type: 'IN' | 'OUT'
  quantity: number
  note: string | null
  transaction_date: string
}

function toResponse(row: InventoryTransactionRow): InventoryTransactionResponseDto {
  return {
    id: row.id,
    productId: row.product_id,
    warehouseId: row.warehouse_id,
    type: row.type,
    quantity: row.quantity,
    ...(row.note != null ? { note: row.note } : {}),
    transactionDate: row.transaction_date
  }
}

// ── InventoryTransactionService ────────────────────────────────────────────
// NOTE: The inventory_transactions table is not yet in 001_init.sql.
// Add a migration (e.g. 002_add_warehouses.sql or 003_inventory_tx.sql):
//
//   CREATE TABLE IF NOT EXISTS inventory_transactions (
//     id               TEXT    PRIMARY KEY,
//     product_id       TEXT    NOT NULL,
//     warehouse_id     TEXT    NOT NULL,
//     type             TEXT    NOT NULL CHECK(type IN ('IN','OUT')),
//     quantity         REAL    NOT NULL,
//     note             TEXT,
//     transaction_date TEXT    NOT NULL
//   );

export class SQLiteInventoryTransactionRepository {
  constructor(private readonly db: Database) {}

  async getAllAsync(): Promise<InventoryTransactionResponseDto[]> {
    const rows = this.db
      .prepare<[], InventoryTransactionRow>(
        'SELECT * FROM inventory_transactions ORDER BY transaction_date DESC'
      )
      .all()
    return rows.map(toResponse)
  }

  async getByIdAsync(id: string): Promise<InventoryTransactionResponseDto | null> {
    const row = this.db
      .prepare<[string], InventoryTransactionRow>(
        'SELECT * FROM inventory_transactions WHERE id = ?'
      )
      .get(id)
    return row ? toResponse(row) : null
  }

  async createAsync(
    request: InventoryTransactionRequestDto
  ): Promise<InventoryTransactionResponseDto> {
    const id = crypto.randomUUID()
    const transactionDate = new Date().toISOString()

    this.db
      .prepare<[string, string, string, 'IN' | 'OUT', number, string | null, string], void>(
        `INSERT INTO inventory_transactions
           (id, product_id, warehouse_id, type, quantity, note, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        request.productId,
        request.warehouseId,
        request.type,
        request.quantity,
        request.note ?? null,
        transactionDate
      )

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(
    id: string,
    request: InventoryTransactionRequestDto
  ): Promise<InventoryTransactionResponseDto> {
    const existing = this.db
      .prepare<[string], InventoryTransactionRow>(
        'SELECT * FROM inventory_transactions WHERE id = ?'
      )
      .get(id)

    if (!existing) {
      throw new Error(`InventoryTransaction with id "${id}" not found.`)
    }

    this.db
      .prepare<[string, string, 'IN' | 'OUT', number, string | null, string], void>(
        `UPDATE inventory_transactions
         SET product_id = ?, warehouse_id = ?, type = ?, quantity = ?, note = ?
         WHERE id = ?`
      )
      .run(
        request.productId,
        request.warehouseId,
        request.type,
        request.quantity,
        request.note ?? null,
        id
      )

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const result = this.db
      .prepare<[string], void>('DELETE FROM inventory_transactions WHERE id = ?')
      .run(id)
    return result.changes > 0
  }
}
