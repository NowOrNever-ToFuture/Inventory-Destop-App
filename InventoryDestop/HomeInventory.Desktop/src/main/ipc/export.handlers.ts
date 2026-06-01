import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import { ExcelExportService } from '@infrastructure/services/ExcelExportService'

export function registerExportHandlers(ipcMain: IpcMain, db: Database): void {
  const exportService = new ExcelExportService(db)

  ipcMain.handle(
    IpcChannels.EXPORT_PURCHASE_REPORT,
    async (_event, year?: number): Promise<string | null> => {
      return exportService.exportPurchaseReport(year)
    }
  )

  ipcMain.handle(
    IpcChannels.EXPORT_SALES_REPORT,
    async (_event, year?: number): Promise<string | null> => {
      return exportService.exportSalesReport(year)
    }
  )

  ipcMain.handle(
    IpcChannels.EXPORT_INVENTORY_REPORT,
    async (): Promise<string | null> => {
      return exportService.exportInventoryReport()
    }
  )

  ipcMain.handle(
    IpcChannels.EXPORT_YEARLY_REPORT,
    async (_event, year?: number): Promise<string | null> => {
      return exportService.exportYearlyReport(year)
    }
  )

  ipcMain.handle(
    IpcChannels.EXPORT_PURCHASE_BY_MONTH,
    async (_event, year: number, month: number): Promise<string | null> => {
      return exportService.exportPurchaseByMonth(year, month)
    }
  )
}
