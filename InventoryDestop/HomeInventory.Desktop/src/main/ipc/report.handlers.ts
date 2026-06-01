import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type {
  ImportSummaryDto,
  TopImportedItemDto,
  TopImportedItemsReportRequestDto,
  TopSupplierReportRequestDto,
  TopSupplierDto
} from '@shared/types/dtos/report.dto'
import { ReportUseCases } from '@core/use-cases'
import { SQLiteReportRepository } from '@infrastructure/repositories'

export interface InventorySummary {
  totalProducts: number
  totalStockValue: number
}

export interface SalesSummary {
  totalOrders: number
  totalRevenue: number
}

export function registerReportHandlers(ipcMain: IpcMain, db: Database): void {
  const reportService = new ReportUseCases(new SQLiteReportRepository(db))

  ipcMain.handle(IpcChannels.REPORT_INVENTORY_SUMMARY, async (): Promise<InventorySummary> => {
    return reportService.getInventorySummaryAsync()
  })

  ipcMain.handle(IpcChannels.REPORT_SALES_SUMMARY, async (): Promise<SalesSummary> => {
    return reportService.getSalesSummaryAsync()
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
      return reportService.getSalesOrderMonthlyAsync(year)
    }
  )

  ipcMain.handle(IpcChannels.REPORT_AVAILABLE_YEARS, async (): Promise<number[]> => {
    return reportService.getAvailableYearsAsync()
  })

  ipcMain.handle(
    IpcChannels.REPORT_TOP_IMPORTED_ITEMS,
    async (_event, request: TopImportedItemsReportRequestDto): Promise<TopImportedItemDto[]> => {
      return reportService.getTopImportedItemsAsync(request)
    }
  )

  ipcMain.handle(
    IpcChannels.REPORT_TOP_SUPPLIERS,
    async (_event, request: TopSupplierReportRequestDto): Promise<TopSupplierDto[]> => {
      return reportService.getTopSuppliersAsync(request)
    }
  )
}
