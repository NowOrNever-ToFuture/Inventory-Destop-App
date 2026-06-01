import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'

export const exportApi = {
  exportPurchaseReport: (year?: number): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.EXPORT_PURCHASE_REPORT, year),

  exportSalesReport: (year?: number): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.EXPORT_SALES_REPORT, year),

  exportInventoryReport: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.EXPORT_INVENTORY_REPORT),

  exportYearlyReport: (year?: number): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.EXPORT_YEARLY_REPORT, year),

  exportPurchaseByMonth: (year: number, month: number): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.EXPORT_PURCHASE_BY_MONTH, year, month),
}

export type ExportApi = typeof exportApi
