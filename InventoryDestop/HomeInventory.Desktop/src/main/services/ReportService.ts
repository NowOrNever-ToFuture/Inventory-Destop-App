import type { Database } from 'better-sqlite3'
import type { ImportSummaryDto } from '@shared/types/dtos/report.dto'

// ── ReportService ──────────────────────────────────────────────────────────

export class ReportService {
  constructor(private readonly db: Database) {}

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
}
