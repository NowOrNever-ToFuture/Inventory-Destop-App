// ─── IPC Channel Names (single source of truth) ───────────────────────────
// Used by both:
//   - src/main/ipc/ handlers (ipcMain.handle)
//   - src/preload/api/ wrappers (ipcRenderer.invoke)

export const IpcChannels = {
  // Product
  PRODUCT_GET_ALL: 'product:getAll',
  PRODUCT_GET_LIST: 'product:getList',
  PRODUCT_GET_BY_ID: 'product:getById',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Category
  CATEGORY_GET_ALL: 'category:getAll',
  CATEGORY_CREATE: 'category:create',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',

  // Brand
  BRAND_GET_ALL: 'brand:getAll',
  BRAND_CREATE: 'brand:create',
  BRAND_UPDATE: 'brand:update',
  BRAND_DELETE: 'brand:delete',

  // Supplier
  SUPPLIER_GET_ALL: 'supplier:getAll',
  SUPPLIER_CREATE: 'supplier:create',
  SUPPLIER_UPDATE: 'supplier:update',
  SUPPLIER_DELETE: 'supplier:delete',

  // Purchase Order
  PURCHASE_ORDER_GET_ALL: 'purchaseOrder:getAll',
  PURCHASE_ORDER_GET_BY_ID: 'purchaseOrder:getById',
  PURCHASE_ORDER_CREATE: 'purchaseOrder:create',
  PURCHASE_ORDER_DELETE: 'purchaseOrder:delete',

  // Sales Order
  SALES_ORDER_GET_ALL: 'salesOrder:getAll',
  SALES_ORDER_GET_BY_ID: 'salesOrder:getById',
  SALES_ORDER_CREATE: 'salesOrder:create',
  SALES_ORDER_DELETE: 'salesOrder:delete',

  // Report
  REPORT_INVENTORY_SUMMARY: 'report:inventorySummary',
  REPORT_SALES_SUMMARY: 'report:salesSummary',
  REPORT_IMPORT_SUMMARY: 'report:importSummary',
  REPORT_SALES_ORDER_MONTHLY: 'report:salesOrderMonthly',
  REPORT_AVAILABLE_YEARS: 'report:availableYears',
  REPORT_TOP_IMPORTED_ITEMS: 'report:topImportedItems',
  REPORT_TOP_SUPPLIERS: 'report:topSuppliers',

  // Export
  EXPORT_PURCHASE_REPORT: 'export:purchaseReport',
  EXPORT_SALES_REPORT: 'export:salesReport',
  EXPORT_INVENTORY_REPORT: 'export:inventoryReport',
  EXPORT_YEARLY_REPORT: 'export:yearlyReport',
  EXPORT_PURCHASE_BY_MONTH: 'export:purchaseByMonth'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]
