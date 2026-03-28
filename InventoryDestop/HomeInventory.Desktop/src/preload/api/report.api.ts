import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type {
  ImportSummaryDto,
  AvailableYearsResponseDto,
  TopImportedItemDto,
  TopImportedItemsReportRequestDto
} from '@shared/types/dtos/report.dto'

export interface InventorySummary {
  totalProducts: number
  totalStockValue: number
}

export interface SalesSummary {
  totalOrders: number
  totalRevenue: number
}

export const reportApi = {
  getInventorySummary: (): Promise<InventorySummary> =>
    ipcRenderer.invoke(IpcChannels.REPORT_INVENTORY_SUMMARY),

  getSalesSummary: (): Promise<SalesSummary> =>
    ipcRenderer.invoke(IpcChannels.REPORT_SALES_SUMMARY),

  getImportSummary: (year: number): Promise<ImportSummaryDto[]> =>
    ipcRenderer.invoke(IpcChannels.REPORT_IMPORT_SUMMARY, year),

  getAvailableYears: (): Promise<AvailableYearsResponseDto> =>
    ipcRenderer.invoke(IpcChannels.REPORT_AVAILABLE_YEARS),

  getSalesOrderMonthly: (year: number): Promise<number[]> =>
    ipcRenderer.invoke(IpcChannels.REPORT_SALES_ORDER_MONTHLY, year),

  getTopImportedItems: (request: TopImportedItemsReportRequestDto): Promise<TopImportedItemDto[]> =>
    ipcRenderer.invoke(IpcChannels.REPORT_TOP_IMPORTED_ITEMS, request)
}

export type ReportApi = typeof reportApi
