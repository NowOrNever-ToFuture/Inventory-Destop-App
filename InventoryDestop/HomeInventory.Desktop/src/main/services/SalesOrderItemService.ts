import type { Database } from 'better-sqlite3'
import type {
  StandaloneSalesOrderItemRequestDto,
  StandaloneSalesOrderItemResponseDto
} from '@shared/types/dtos/sales-order.dto'

interface SalesOrderItemRow {
  id: string
  sales_order_id: string
  product_id: string
  quantity: number
}

function toResponse(row: SalesOrderItemRow): StandaloneSalesOrderItemResponseDto {
  return {
    id: row.id,
    salesOrderId: row.sales_order_id,
    productId: row.product_id,
    quantity: row.quantity
  }
}

// ── SalesOrderItemService ──────────────────────────────────────────────────
// Standalone read/write access to individual sales_order_items rows.
// For full order flow with stock management use SalesOrderService instead.

export class SalesOrderItemService {
  constructor(private readonly db: Database) {}

  async getAllAsync(): Promise<StandaloneSalesOrderItemResponseDto[]> {
    const rows = this.db
      .prepare<[], SalesOrderItemRow>('SELECT * FROM sales_order_items')
      .all()
    return rows.map(toResponse)
  }

  async getByIdAsync(id: string): Promise<StandaloneSalesOrderItemResponseDto | null> {
    const row = this.db
      .prepare<[string], SalesOrderItemRow>(
        'SELECT * FROM sales_order_items WHERE id = ?'
      )
      .get(id)
    return row ? toResponse(row) : null
  }

  async createAsync(
    request: StandaloneSalesOrderItemRequestDto
  ): Promise<StandaloneSalesOrderItemResponseDto> {
    const id = crypto.randomUUID()

    this.db
      .prepare<[string, string, string, number], void>(
        `INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity)
         VALUES (?, ?, ?, ?)`
      )
      .run(id, request.salesOrderId, request.productId, request.quantity)

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(
    id: string,
    request: StandaloneSalesOrderItemRequestDto
  ): Promise<StandaloneSalesOrderItemResponseDto> {
    const existing = this.db
      .prepare<[string], SalesOrderItemRow>(
        'SELECT * FROM sales_order_items WHERE id = ?'
      )
      .get(id)

    if (!existing) {
      throw new Error(`SalesOrderItem with id "${id}" not found.`)
    }

    this.db
      .prepare<[string, number, string], void>(
        'UPDATE sales_order_items SET product_id = ?, quantity = ? WHERE id = ?'
      )
      .run(request.productId, request.quantity, id)

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const result = this.db
      .prepare<[string], void>('DELETE FROM sales_order_items WHERE id = ?')
      .run(id)
    return result.changes > 0
  }
}
