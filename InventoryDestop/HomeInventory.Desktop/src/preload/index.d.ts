import { ElectronAPI } from '@electron-toolkit/preload'
import type { ProductApi } from './api/product.api'
import type { ReportApi } from './api/report.api'
import type { CategoryApi } from './api/category.api'
import type { BrandApi } from './api/brand.api'
import type { SupplierApi } from './api/supplier.api'
import type { PurchaseOrderApi } from './api/purchase-order.api'
import type { SalesOrderApi } from './api/sales-order.api'
import type { ExportApi } from './api/export.api'
import type { SettingsApi, FileApi } from './api/settings.api'
import type { AuthApi } from './api/auth.api'

interface DesktopApi {
  product: ProductApi
  report: ReportApi
  category: CategoryApi
  brand: BrandApi
  supplier: SupplierApi
  purchaseOrder: PurchaseOrderApi
  salesOrder: SalesOrderApi
  export: ExportApi
  settings: SettingsApi
  file: FileApi
  auth: AuthApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DesktopApi
  }
}
