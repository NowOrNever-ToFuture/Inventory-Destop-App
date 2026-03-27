import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { ImportSummaryDto } from '@shared/types/dtos/report.dto'
import { ReportService } from '@main/services'

export interface InventorySummary {
  totalProducts: number
  totalStockValue: number
}

export interface SalesSummary {
  totalOrders: number
  totalRevenue: number
}

export function registerReportHandlers(ipcMain: IpcMain, db: Database): void {
  const reportService = new ReportService(db)

  ipcMain.handle(IpcChannels.REPORT_INVENTORY_SUMMARY, async (): Promise<InventorySummary> => {
    const row = db
      .prepare(
        'SELECT COUNT(*) as totalProducts, SUM(stock_quantity * import_price) as totalStockValue FROM products'
      )
      .get() as { totalProducts: number; totalStockValue: number }
    return { totalProducts: row.totalProducts, totalStockValue: row.totalStockValue ?? 0 }
  })

  ipcMain.handle(IpcChannels.REPORT_SALES_SUMMARY, async (): Promise<SalesSummary> => {
    const row = db.prepare('SELECT COUNT(*) as totalOrders FROM sales_orders').get() as {
      totalOrders: number
    }
    return { totalOrders: row.totalOrders, totalRevenue: 0 }
  })

  ipcMain.handle(
    IpcChannels.REPORT_IMPORT_SUMMARY,
    async (_event, year: number): Promise<ImportSummaryDto[]> => {
      return reportService.getImportSummaryAsync(year)
    }
  )

  ipcMain.handle(
    IpcChannels.REPORT_SALES_ORDER_MONTHLY,
    async (_event, year: number): Promise<number[]> => {
      const rows = db
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
  )

  ipcMain.handle(IpcChannels.REPORT_AVAILABLE_YEARS, async (): Promise<number[]> => {
    return reportService.getAvailableYearsAsync()
  })
}
