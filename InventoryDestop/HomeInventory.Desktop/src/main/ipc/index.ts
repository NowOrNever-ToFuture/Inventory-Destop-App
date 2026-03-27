import { ipcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { registerProductHandlers } from './product.handlers'
import { registerReportHandlers } from './report.handlers'
import { registerCategoryHandlers } from './category.handlers'
import { registerBrandHandlers } from './brand.handlers'
import { registerSupplierHandlers } from './supplier.handlers'
import { registerPurchaseOrderHandlers } from './purchase-order.handlers'
import { registerSalesOrderHandlers } from './sales-order.handlers'

export function registerIpcHandlers(db: Database): void {
  registerProductHandlers(ipcMain, db)
  registerReportHandlers(ipcMain, db)
  registerCategoryHandlers(ipcMain, db)
  registerBrandHandlers(ipcMain, db)
  registerSupplierHandlers(ipcMain, db)
  registerPurchaseOrderHandlers(ipcMain, db)
  registerSalesOrderHandlers(ipcMain, db)
}
