import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { productApi } from './api/product.api'
import { reportApi } from './api/report.api'
import { categoryApi } from './api/category.api'
import { brandApi } from './api/brand.api'
import { supplierApi } from './api/supplier.api'
import { purchaseOrderApi } from './api/purchase-order.api'
import { salesOrderApi } from './api/sales-order.api'

// Custom APIs for renderer
const api = {
  product: productApi,
  report: reportApi,
  category: categoryApi,
  brand: brandApi,
  supplier: supplierApi,
  purchaseOrder: purchaseOrderApi,
  salesOrder: salesOrderApi
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
