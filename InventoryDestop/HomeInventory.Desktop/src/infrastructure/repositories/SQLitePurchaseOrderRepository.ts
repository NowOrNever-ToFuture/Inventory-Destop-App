import type { Database } from 'better-sqlite3'
import type {
  PurchaseOrderRequestDto,
  PurchaseOrderResponseDto,
  PurchaseOrderItemResponseDto
} from '@shared/types/dtos/purchase-order.dto'
import { MAX_MONEY, MAX_MONEY_ERROR_MESSAGE } from '@shared/constants'
import { SQLiteProductRepository } from './SQLiteProductRepository'
import { toMoneyInt, fromMoneyInt } from '@shared/utils/money'

interface PurchaseOrderRow {
  id: string
  code: string
  supplier_id: string
  order_date: string
  total_amount: number
}

interface PurchaseOrderItemRow {
  id: string
  purchase_order_id: string
  product_id: string
  quantity: number
  unit_cost: number
  line_total: number
}

function mapItems(items: PurchaseOrderItemRow[]): PurchaseOrderItemResponseDto[] {
  return items.map((r) => ({
    productId: r.product_id,
    quantity: r.quantity,
    unitCost: fromMoneyInt(r.unit_cost),
    lineTotal: fromMoneyInt(r.line_total)
  }))
}

// ── PurchaseOrderService ───────────────────────────────────────────────────

export class SQLitePurchaseOrderRepository {
  private readonly productService: SQLiteProductRepository

  constructor(private readonly db: Database) {
    this.productService = new SQLiteProductRepository(db)
  }

  private generateUniqueId(): string {
    let id = crypto.randomUUID()
    while (
      this.db
        .prepare<[string], { id: string }>('SELECT id FROM purchase_orders WHERE id = ?')
        .get(id)
    ) {
      id = crypto.randomUUID()
    }
    return id
  }

  private resolveOrderDate(orderDate?: string): string {
    if (orderDate && /^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
      return orderDate
    }
    return new Date().toISOString().slice(0, 10)
  }

  private validateMoney(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Giá trị tiền không hợp lệ')
    }
    if (value > MAX_MONEY) {
      throw new Error(MAX_MONEY_ERROR_MESSAGE)
    }
  }

  private getItems(purchaseOrderId: string): PurchaseOrderItemRow[] {
    return this.db
      .prepare<
        [string],
        PurchaseOrderItemRow
      >('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?')
      .all(purchaseOrderId)
  }

  private toResponse(
    row: PurchaseOrderRow,
    items: PurchaseOrderItemRow[]
  ): PurchaseOrderResponseDto {
    return {
      id: row.id,
      code: row.code,
      orderDate: row.order_date,
      supplierId: row.supplier_id,
      totalAmount: fromMoneyInt(row.total_amount),
      items: mapItems(items)
    }
  }

  async getAllAsync(): Promise<PurchaseOrderResponseDto[]> {
    const orders = this.db
      .prepare<[], PurchaseOrderRow>('SELECT * FROM purchase_orders ORDER BY order_date DESC')
      .all()

    return orders.map((order) => this.toResponse(order, this.getItems(order.id)))
  }

  async getByIdAsync(id: string): Promise<PurchaseOrderResponseDto | null> {
    const row = this.db
      .prepare<[string], PurchaseOrderRow>('SELECT * FROM purchase_orders WHERE id = ?')
      .get(id)

    if (!row) return null
    return this.toResponse(row, this.getItems(row.id))
  }

  async createAsync(request: PurchaseOrderRequestDto): Promise<PurchaseOrderResponseDto> {
    const id = this.generateUniqueId()
    const code = request.code?.trim() || `PO-${Date.now()}`
    const orderDate = this.resolveOrderDate(request.orderDate)

    // Validate money for all items first
    for (const item of request.items) {
      this.validateMoney(item.unitCost)
      this.validateMoney(item.quantity * item.unitCost)
    }

    // Resolve or auto-create products in parallel
    const resolvedItems = await Promise.all(
      request.items.map(async (item) => {
        const modelNorm = item.model.trim().toLowerCase()
        let product = this.db
          .prepare<[string], { id: string }>('SELECT id FROM products WHERE model_normalized = ?')
          .get(modelNorm)

        if (!product) {
          const created = await this.productService.createAsync({
            model: item.model,
            name: item.name,
            unit: item.unit,
            categoryId: item.categoryId,
            brandId: item.brandId,
            stockQuantity: 0,
            importPrice: item.unitCost
          })
          product = { id: created.id }
        }

        return {
          productId: product.id,
          quantity: item.quantity,
          unitCost: toMoneyInt(item.unitCost),
          lineTotal: toMoneyInt(item.quantity * item.unitCost)
        }
      })
    )

    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0)
    this.validateMoney(fromMoneyInt(totalAmount))

    this.db.transaction(() => {
      // Insert purchase order
      this.db
        .prepare<[string, string, string, string, number], void>(
          `INSERT INTO purchase_orders (id, code, supplier_id, order_date, total_amount)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(id, code, request.supplierId, orderDate, totalAmount)

      // Insert items + update product stock
      const insertItem = this.db.prepare<[string, string, string, number, number, number], void>(
        `INSERT INTO purchase_order_items
           (id, purchase_order_id, product_id, quantity, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      const updateStock = this.db.prepare<[number, string], void>(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?'
      )

      for (const item of resolvedItems) {
        insertItem.run(
          crypto.randomUUID(),
          id,
          item.productId,
          item.quantity,
          item.unitCost,
          item.lineTotal
        )
        updateStock.run(item.quantity, item.productId)
      }
    })()

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(
    id: string,
    request: PurchaseOrderRequestDto
  ): Promise<PurchaseOrderResponseDto> {
    const existing = this.db
      .prepare<[string], PurchaseOrderRow>('SELECT * FROM purchase_orders WHERE id = ?')
      .get(id)

    if (!existing) {
      throw new Error(`PurchaseOrder with id "${id}" not found.`)
    }

    const code = request.code?.trim() || existing.code

    // Revert old stock adjustments
    const oldItems = this.getItems(id)
    this.db.transaction(() => {
      const revertStock = this.db.prepare<[number, string], void>(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?'
      )
      for (const item of oldItems) {
        revertStock.run(item.quantity, item.product_id)
      }

      // Remove old items
      this.db
        .prepare<[string], void>('DELETE FROM purchase_order_items WHERE purchase_order_id = ?')
        .run(id)
    })()

    // Rebuild items using same auto-create logic as create
    // Validate money for all items first
    for (const item of request.items) {
      this.validateMoney(item.unitCost)
      this.validateMoney(item.quantity * item.unitCost)
    }

    // Resolve or auto-create products in parallel
    const resolvedItems = await Promise.all(
      request.items.map(async (item) => {
        const modelNorm = item.model.trim().toLowerCase()
        let product = this.db
          .prepare<[string], { id: string }>('SELECT id FROM products WHERE model_normalized = ?')
          .get(modelNorm)

        if (!product) {
          const created = await this.productService.createAsync({
            model: item.model,
            name: item.name,
            unit: item.unit,
            categoryId: item.categoryId,
            brandId: item.brandId,
            stockQuantity: 0,
            importPrice: item.unitCost
          })
          product = { id: created.id }
        }

        return {
          productId: product.id,
          quantity: item.quantity,
          unitCost: toMoneyInt(item.unitCost),
          lineTotal: toMoneyInt(item.quantity * item.unitCost)
        }
      })
    )

    const totalAmount = resolvedItems.reduce((sum, i) => sum + i.lineTotal, 0)
    this.validateMoney(fromMoneyInt(totalAmount))

    this.db.transaction(() => {
      this.db
        .prepare<
          [string, number, string],
          void
        >('UPDATE purchase_orders SET code = ?, total_amount = ? WHERE id = ?')
        .run(code, totalAmount, id)

      const insertItem = this.db.prepare<[string, string, string, number, number, number], void>(
        `INSERT INTO purchase_order_items
           (id, purchase_order_id, product_id, quantity, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      const updateStock = this.db.prepare<[number, string], void>(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?'
      )

      for (const item of resolvedItems) {
        insertItem.run(
          crypto.randomUUID(),
          id,
          item.productId,
          item.quantity,
          item.unitCost,
          item.lineTotal
        )
        updateStock.run(item.quantity, item.productId)
      }
    })()

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const existing = this.db
      .prepare<[string], PurchaseOrderRow>('SELECT * FROM purchase_orders WHERE id = ?')
      .get(id)

    if (!existing) return false

    // Revert stock
    const items = this.getItems(id)
    this.db.transaction(() => {
      const revertStock = this.db.prepare<[number, string], void>(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?'
      )
      for (const item of items) {
        revertStock.run(item.quantity, item.product_id)
      }

      this.db
        .prepare<[string], void>('DELETE FROM purchase_order_items WHERE purchase_order_id = ?')
        .run(id)
      this.db.prepare<[string], void>('DELETE FROM purchase_orders WHERE id = ?').run(id)
    })()

    return true
  }
}
