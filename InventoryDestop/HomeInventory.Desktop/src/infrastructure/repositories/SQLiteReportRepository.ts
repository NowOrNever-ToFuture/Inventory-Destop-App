import type { Database } from 'better-sqlite3'
import type {
  ImportSummaryDto,
  TopImportedItemDto,
  TopImportedItemsReportRequestDto,
  TopSupplierReportRequestDto,
  TopSupplierDto
} from '@shared/types/dtos/report.dto'
import { fromMoneyInt } from '@shared/utils/money'

// ── ReportService ──────────────────────────────────────────────────────────

export class SQLiteReportRepository {
  constructor(private readonly db: Database) {}

  async getInventorySummaryAsync(): Promise<{ totalProducts: number; totalStockValue: number }> {
    const row = this.db
      .prepare(
        'SELECT COUNT(*) as totalProducts, SUM(stock_quantity * import_price) as totalStockValue FROM products'
      )
      .get() as { totalProducts: number; totalStockValue: number }
    return { totalProducts: row.totalProducts, totalStockValue: row.totalStockValue ?? 0 }
  }

  async getSalesSummaryAsync(): Promise<{ totalOrders: number; totalRevenue: number }> {
    const row = this.db.prepare('SELECT COUNT(*) as totalOrders FROM sales_orders').get() as {
      totalOrders: number
    }
    return { totalOrders: row.totalOrders, totalRevenue: 0 }
  }

  async getSalesOrderMonthlyAsync(year: number): Promise<number[]> {
    const rows = this.db
      .prepare(
        `SELECT CAST(strftime('%m', order_date) AS INTEGER) AS month, COUNT(*) AS total
         FROM sales_orders
         WHERE order_date LIKE ?
         GROUP BY month
         ORDER BY month`
      )
      .all(`${year}-%`) as Array<{ month: number; total: number }>

    const result = Array.from({ length: 12 }, () => 0)
    for (const row of rows) {
      if (row.month >= 1 && row.month <= 12) {
        result[row.month - 1] = row.total
      }
    }
    return result
  }

  private normalizeTopImportedRequest(
    request: TopImportedItemsReportRequestDto
  ): TopImportedItemsReportRequestDto {
    const safeYear = Number.isFinite(request.year)
      ? Math.trunc(request.year)
      : new Date().getFullYear()
    const safeScope = request.scope === 'month' ? 'month' : 'year'

    if (safeScope === 'month') {
      const month = Number.isFinite(request.month)
        ? Math.max(1, Math.min(12, Math.trunc(request.month as number)))
        : 1

      return {
        scope: safeScope,
        year: safeYear,
        month
      }
    }

    return {
      scope: safeScope,
      year: safeYear
    }
  }

  async getAvailableYearsAsync(): Promise<number[]> {
    const rows = this.db
      .prepare<[], { year: number }>(
        `SELECT DISTINCT CAST(strftime('%Y', order_date) AS INTEGER) AS year
         FROM purchase_orders
         WHERE order_date IS NOT NULL AND trim(order_date) != ''
         ORDER BY year DESC`
      )
      .all()

    return rows.reduce<number[]>((acc, r) => {
      if (Number.isFinite(r.year)) acc.push(r.year)
      return acc
    }, [])
  }

  /**
   * Returns import (purchase) summary grouped by month.
   *
   * @param year  - Required. Filter to this calendar year.
   * @param month - Optional. When provided, limit to only that month (1-12).
   */
  async getImportSummaryAsync(year: number, month?: number): Promise<ImportSummaryDto[]> {
    if (month != null) {
      const monthStr = String(month).padStart(2, '0')
      const prefix = `${year}-${monthStr}-%`

      const importRow = this.db
        .prepare<[string], { totalOrders: number; totalAmount: number }>(
          `SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_amount), 0) AS totalAmount
           FROM purchase_orders WHERE order_date LIKE ?`
        )
        .get(prefix) ?? { totalOrders: 0, totalAmount: 0 }

      const salesRow = this.db
        .prepare<
          [string],
          { totalSalesOrders: number }
        >(`SELECT COUNT(*) AS totalSalesOrders FROM sales_orders WHERE order_date LIKE ?`)
        .get(prefix) ?? { totalSalesOrders: 0 }

      return [
        {
          year,
          month,
          totalOrders: importRow.totalOrders,
          totalAmount: importRow.totalAmount,
          totalSalesOrders: salesRow.totalSalesOrders,
          totalSalesAmount: 0
        }
      ]
    }

    // Full year – group by month
    const importRows = this.db
      .prepare<[string], { month_num: number; totalOrders: number; totalAmount: number }>(
        `SELECT CAST(strftime('%m', order_date) AS INTEGER) AS month_num,
                COUNT(*) AS totalOrders,
                COALESCE(SUM(total_amount), 0) AS totalAmount
         FROM purchase_orders
         WHERE order_date LIKE ?
         GROUP BY month_num ORDER BY month_num`
      )
      .all(`${year}-%`)

    const salesRows = this.db
      .prepare<[string], { month_num: number; totalSalesOrders: number }>(
        `SELECT CAST(strftime('%m', order_date) AS INTEGER) AS month_num,
                COUNT(*) AS totalSalesOrders
         FROM sales_orders
         WHERE order_date LIKE ?
         GROUP BY month_num ORDER BY month_num`
      )
      .all(`${year}-%`)

    const salesMap = new Map(salesRows.map((r) => [r.month_num, r.totalSalesOrders]))

    return importRows.map((r) => ({
      year,
      month: r.month_num,
      totalOrders: r.totalOrders,
      totalAmount: r.totalAmount,
      totalSalesOrders: salesMap.get(r.month_num) ?? 0,
      totalSalesAmount: 0
    }))
  }

  async getTopImportedItemsAsync(
    request: TopImportedItemsReportRequestDto
  ): Promise<TopImportedItemDto[]> {
    const normalized = this.normalizeTopImportedRequest(request)
    const whereClause =
      normalized.scope === 'month'
        ? `CAST(strftime('%Y', po.order_date) AS INTEGER) = ?
           AND CAST(strftime('%m', po.order_date) AS INTEGER) = ?`
        : `CAST(strftime('%Y', po.order_date) AS INTEGER) = ?`

    const params: Array<number> =
      normalized.scope === 'month'
        ? [normalized.year, normalized.month as number]
        : [normalized.year]

    const rows = this.db
      .prepare<Array<number>, { model: string; name: string; totalQuantity: number }>(
        `SELECT
           p.model AS model,
           p.name AS name,
           COALESCE(SUM(poi.quantity), 0) AS totalQuantity
         FROM purchase_order_items poi
         INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id
         INNER JOIN products p ON p.id = poi.product_id
         WHERE ${whereClause}
         GROUP BY poi.product_id, p.model, p.name
         ORDER BY totalQuantity DESC
         LIMIT 8`
      )
      .all(...params)

    return rows.reduce<TopImportedItemDto[]>((acc, row) => {
      const model = row.model?.trim() ?? ''
      const name = row.name?.trim() ?? ''
      const label = model && name ? `${model} - ${name}` : model || name || 'Không xác định'
      const quantity = Number.isFinite(row.totalQuantity) ? Math.max(0, row.totalQuantity) : 0
      if (quantity >= 0) acc.push({ label, quantity })
      return acc
    }, [])
  }

  async getTopSuppliersAsync(request: TopSupplierReportRequestDto): Promise<TopSupplierDto[]> {
    const safeYear = Number.isFinite(request.year)
      ? Math.trunc(request.year)
      : new Date().getFullYear()
    const safeScope = request.scope === 'month' ? 'month' : 'year'

    let whereClause: string
    let params: Array<number>

    if (safeScope === 'month') {
      const month = Number.isFinite(request.month)
        ? Math.max(1, Math.min(12, Math.trunc(request.month as number)))
        : 1
      whereClause = `CAST(strftime('%Y', po.order_date) AS INTEGER) = ?
         AND CAST(strftime('%m', po.order_date) AS INTEGER) = ?`
      params = [safeYear, month]
    } else {
      whereClause = `CAST(strftime('%Y', po.order_date) AS INTEGER) = ?`
      params = [safeYear]
    }

    const rows = this.db
      .prepare<Array<number>, { supplier_name: string; total_amount: number }>(
        `SELECT
           s.name AS supplier_name,
           COALESCE(SUM(po.total_amount), 0) AS total_amount
         FROM purchase_orders po
         INNER JOIN suppliers s ON s.id = po.supplier_id
         WHERE ${whereClause}
         GROUP BY po.supplier_id, s.name
         ORDER BY total_amount DESC
         LIMIT 8`
      )
      .all(...params)

    return rows.map((row) => ({
      supplierName: row.supplier_name?.trim() || 'Không xác định',
      totalAmount: fromMoneyInt(row.total_amount)
    }))
  }
}
