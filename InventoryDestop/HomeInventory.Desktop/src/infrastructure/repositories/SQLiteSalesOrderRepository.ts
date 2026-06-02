import type { Database } from 'better-sqlite3'
import type {
  SalesOrderRequestDto,
  SalesOrderResponseDto,
  SalesOrderItemResponseDto
} from '@shared/types/dtos/sales-order.dto'

interface SalesOrderRow {
  id: string
  code: string
  order_date: string
}

interface SalesOrderItemRow {
  id: string
  sales_order_id: string
  product_id: string
  quantity: number
}

function mapItems(items: SalesOrderItemRow[]): SalesOrderItemResponseDto[] {
  return items.map((r) => ({
    productId: r.product_id,
    quantity: r.quantity
  }))
}

// ── SalesOrderService ──────────────────────────────────────────────────────

export class SQLiteSalesOrderRepository {
  constructor(private readonly db: Database) {}

  private resolveOrderDate(orderDate?: string): string {
    if (orderDate && /^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
      const today = new Date().toISOString().slice(0, 10)
      if (orderDate > today) {
        throw new Error('Ngày lập phiếu không thể là ngày trong tương lai.')
      }
      return orderDate
    }
    return new Date().toISOString().slice(0, 10)
  }

  private generateUniqueId(): string {
    let id = crypto.randomUUID()
    while (
      this.db.prepare<[string], { id: string }>('SELECT id FROM sales_orders WHERE id = ?').get(id)
    ) {
      id = crypto.randomUUID()
    }
    return id
  }

  private getItems(salesOrderId: string): SalesOrderItemRow[] {
    return this.db
      .prepare<
        [string],
        SalesOrderItemRow
      >('SELECT * FROM sales_order_items WHERE sales_order_id = ?')
      .all(salesOrderId)
  }

  private toResponse(row: SalesOrderRow, items: SalesOrderItemRow[]): SalesOrderResponseDto {
    return {
      id: row.id,
      code: row.code,
      orderDate: row.order_date,
      items: mapItems(items)
    }
  }

  async getAllAsync(): Promise<SalesOrderResponseDto[]> {
    const orders = this.db
      .prepare<[], SalesOrderRow>('SELECT * FROM sales_orders ORDER BY order_date DESC')
      .all()
    return orders.map((o) => this.toResponse(o, this.getItems(o.id)))
  }

  async getByIdAsync(id: string): Promise<SalesOrderResponseDto | null> {
    const row = this.db
      .prepare<[string], SalesOrderRow>('SELECT * FROM sales_orders WHERE id = ?')
      .get(id)
    if (!row) return null
    return this.toResponse(row, this.getItems(row.id))
  }

  async createAsync(request: SalesOrderRequestDto): Promise<SalesOrderResponseDto> {
    const id = this.generateUniqueId()
    const code = request.code?.trim() || `SO-${Date.now()}`
    const orderDate = this.resolveOrderDate(request.orderDate)

    // Validate stock for all items first
    for (const item of request.items) {
      const product = this.db
        .prepare<
          [string],
          { id: string; stock_quantity: number }
        >('SELECT id, stock_quantity FROM products WHERE id = ?')
        .get(item.productId)

      if (!product) {
        throw new Error(`Product "${item.productId}" not found.`)
      }
      if (product.stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for product "${item.productId}": available ${product.stock_quantity}, requested ${item.quantity}.`
        )
      }
    }

    this.db.transaction(() => {
      this.db
        .prepare<
          [string, string, string],
          void
        >('INSERT INTO sales_orders (id, code, order_date) VALUES (?, ?, ?)')
        .run(id, code, orderDate)

      const insertItem = this.db.prepare<[string, string, string, number], void>(
        `INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity)
         VALUES (?, ?, ?, ?)`
      )
      const deductStock = this.db.prepare<[number, string], void>(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?'
      )

      for (const item of request.items) {
        insertItem.run(crypto.randomUUID(), id, item.productId, item.quantity)
        deductStock.run(item.quantity, item.productId)
      }
    })()

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(id: string, request: SalesOrderRequestDto): Promise<SalesOrderResponseDto> {
    const existing = this.db
      .prepare<[string], SalesOrderRow>('SELECT * FROM sales_orders WHERE id = ?')
      .get(id)

    if (!existing) {
      throw new Error(`SalesOrder with id "${id}" not found.`)
    }

    const code = request.code?.trim() || existing.code
    const orderDate = request.orderDate
      ? this.resolveOrderDate(request.orderDate)
      : existing.order_date

    // Restore old stock
    const oldItems = this.getItems(id)
    this.db.transaction(() => {
      const restoreStock = this.db.prepare<[number, string], void>(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?'
      )
      for (const item of oldItems) {
        restoreStock.run(item.quantity, item.product_id)
      }
      this.db
        .prepare<[string], void>('DELETE FROM sales_order_items WHERE sales_order_id = ?')
        .run(id)
    })()

    // Validate new stock
    for (const item of request.items) {
      const product = this.db
        .prepare<
          [string],
          { stock_quantity: number }
        >('SELECT stock_quantity FROM products WHERE id = ?')
        .get(item.productId)

      if (!product) throw new Error(`Product "${item.productId}" not found.`)
      if (product.stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for product "${item.productId}": available ${product.stock_quantity}, requested ${item.quantity}.`
        )
      }
    }

    this.db.transaction(() => {
      this.db
        .prepare<
          [string, string, string],
          void
        >('UPDATE sales_orders SET code = ?, order_date = ? WHERE id = ?')
        .run(code, orderDate, id)

      const insertItem = this.db.prepare<[string, string, string, number], void>(
        `INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity)
         VALUES (?, ?, ?, ?)`
      )
      const deductStock = this.db.prepare<[number, string], void>(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?'
      )

      for (const item of request.items) {
        insertItem.run(crypto.randomUUID(), id, item.productId, item.quantity)
        deductStock.run(item.quantity, item.productId)
      }
    })()

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const existing = this.db
      .prepare<[string], SalesOrderRow>('SELECT * FROM sales_orders WHERE id = ?')
      .get(id)

    if (!existing) return false

    const items = this.getItems(id)

    this.db.transaction(() => {
      const restoreStock = this.db.prepare<[number, string], void>(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?'
      )
      for (const item of items) {
        restoreStock.run(item.quantity, item.product_id)
      }
      this.db
        .prepare<[string], void>('DELETE FROM sales_order_items WHERE sales_order_id = ?')
        .run(id)
      this.db.prepare<[string], void>('DELETE FROM sales_orders WHERE id = ?').run(id)
    })()

    return true
  }
}
