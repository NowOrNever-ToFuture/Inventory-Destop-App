import type { Database } from 'better-sqlite3'
import type {
  StandalonePurchaseOrderItemRequestDto,
  StandalonePurchaseOrderItemResponseDto
} from '@shared/types/dtos/purchase-order.dto'
import { MAX_MONEY, MAX_MONEY_ERROR_MESSAGE } from '@shared/constants'

interface PurchaseOrderItemRow {
  id: string
  purchase_order_id: string
  product_id: string
  quantity: number
  unit_cost: number
  line_total: number
}

function toResponse(row: PurchaseOrderItemRow): StandalonePurchaseOrderItemResponseDto {
  return {
    id: row.id,
    purchaseOrderId: row.purchase_order_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitCost: row.unit_cost,
    lineTotal: row.line_total
  }
}

// ── PurchaseOrderItemService ───────────────────────────────────────────────
// Provides standalone access to purchase_order_items rows.
// For full order management (with stock sync) use PurchaseOrderService instead.

export class SQLitePurchaseOrderItemRepository {
  constructor(private readonly db: Database) {}

  private validateMoney(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Giá trị tiền không hợp lệ')
    }
    if (value > MAX_MONEY) {
      throw new Error(MAX_MONEY_ERROR_MESSAGE)
    }
  }

  async getAllAsync(): Promise<StandalonePurchaseOrderItemResponseDto[]> {
    const rows = this.db
      .prepare<[], PurchaseOrderItemRow>('SELECT * FROM purchase_order_items')
      .all()
    return rows.map(toResponse)
  }

  async getByIdAsync(id: string): Promise<StandalonePurchaseOrderItemResponseDto | null> {
    const row = this.db
      .prepare<[string], PurchaseOrderItemRow>('SELECT * FROM purchase_order_items WHERE id = ?')
      .get(id)
    return row ? toResponse(row) : null
  }

  async createAsync(
    request: StandalonePurchaseOrderItemRequestDto
  ): Promise<StandalonePurchaseOrderItemResponseDto> {
    this.validateMoney(request.unitCost)
    const lineTotal = request.quantity * request.unitCost
    this.validateMoney(lineTotal)
    const id = crypto.randomUUID()

    this.db
      .prepare<[string, string, string, number, number, number], void>(
        `INSERT INTO purchase_order_items
           (id, purchase_order_id, product_id, quantity, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        request.purchaseOrderId,
        request.productId,
        request.quantity,
        request.unitCost,
        lineTotal
      )

    // Recalculate parent order total
    this.recalcOrderTotal(request.purchaseOrderId)

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(
    id: string,
    request: StandalonePurchaseOrderItemRequestDto
  ): Promise<StandalonePurchaseOrderItemResponseDto> {
    const existing = this.db
      .prepare<[string], PurchaseOrderItemRow>('SELECT * FROM purchase_order_items WHERE id = ?')
      .get(id)

    if (!existing) {
      throw new Error(`PurchaseOrderItem with id "${id}" not found.`)
    }

    this.validateMoney(request.unitCost)
    const lineTotal = request.quantity * request.unitCost
    this.validateMoney(lineTotal)

    this.db
      .prepare<[string, number, number, number, string], void>(
        `UPDATE purchase_order_items
         SET product_id = ?, quantity = ?, unit_cost = ?, line_total = ?
         WHERE id = ?`
      )
      .run(request.productId, request.quantity, request.unitCost, lineTotal, id)

    this.recalcOrderTotal(existing.purchase_order_id)

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const item = this.db
      .prepare<
        [string],
        Pick<PurchaseOrderItemRow, 'purchase_order_id'>
      >('SELECT purchase_order_id FROM purchase_order_items WHERE id = ?')
      .get(id)

    if (!item) return false

    const result = this.db
      .prepare<[string], void>('DELETE FROM purchase_order_items WHERE id = ?')
      .run(id)

    if (result.changes > 0) {
      this.recalcOrderTotal(item.purchase_order_id)
    }

    return result.changes > 0
  }

  /** Recompute total_amount on the parent purchase_order after item changes */
  private recalcOrderTotal(purchaseOrderId: string): void {
    const totalRow = this.db
      .prepare<[string], { total: number }>(
        `SELECT COALESCE(SUM(line_total), 0) AS total
         FROM purchase_order_items
         WHERE purchase_order_id = ?`
      )
      .get(purchaseOrderId)

    this.validateMoney(totalRow?.total ?? 0)

    this.db
      .prepare<[string, string], void>(
        `UPDATE purchase_orders
         SET total_amount = (
           SELECT COALESCE(SUM(line_total), 0)
           FROM purchase_order_items
           WHERE purchase_order_id = ?
         )
         WHERE id = ?`
      )
      .run(purchaseOrderId, purchaseOrderId)
  }
}
