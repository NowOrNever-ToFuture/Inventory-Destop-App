import type { Database } from 'better-sqlite3'
import type {
  ImportSummaryDto,
  TopImportedItemDto,
  TopImportedItemsReportRequestDto
} from '@shared/types/dtos/report.dto'

// ── ReportService ──────────────────────────────────────────────────────────

export class ReportService {
  constructor(private readonly db: Database) {}

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

    return rows.map((r) => r.year).filter((year) => Number.isFinite(year))
  }

  /**
   * Returns import (purchase) summary grouped by month.
   *
   * @param year  - Required. Filter to this calendar year.
   * @param month - Optional. When provided, limit to only that month (1-12).
   */
  async getImportSummaryAsync(year: number, month?: number): Promise<ImportSummaryDto[]> {
    if (month != null) {
      // Single month
      const monthStr = String(month).padStart(2, '0')
      const prefix = `${year}-${monthStr}-%`

      const row = this.db
        .prepare<[string], { totalOrders: number; totalAmount: number }>(
          `SELECT
             COUNT(*)       AS totalOrders,
             COALESCE(SUM(total_amount), 0) AS totalAmount
           FROM purchase_orders
           WHERE order_date LIKE ?`
        )
        .get(prefix) ?? { totalOrders: 0, totalAmount: 0 }

      return [
        {
          year,
          month,
          totalOrders: row.totalOrders,
          totalAmount: row.totalAmount
        }
      ]
    }

    // Full year – group by month
    const rows = this.db
      .prepare<[string], { month_num: number; totalOrders: number; totalAmount: number }>(
        `SELECT
           CAST(strftime('%m', order_date) AS INTEGER) AS month_num,
           COUNT(*)       AS totalOrders,
           COALESCE(SUM(total_amount), 0) AS totalAmount
         FROM purchase_orders
         WHERE order_date LIKE ?
         GROUP BY month_num
         ORDER BY month_num`
      )
      .all(`${year}-%`)

    return rows.map((r) => ({
      year,
      month: r.month_num,
      totalOrders: r.totalOrders,
      totalAmount: r.totalAmount
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

    return rows
      .map((row) => {
        const model = row.model?.trim() ?? ''
        const name = row.name?.trim() ?? ''
        const label = model && name ? `${model} - ${name}` : model || name || 'Không xác định'
        const quantity = Number.isFinite(row.totalQuantity) ? Math.max(0, row.totalQuantity) : 0

        return {
          label,
          quantity
        }
      })
      .filter((item) => item.quantity >= 0)
  }
}
