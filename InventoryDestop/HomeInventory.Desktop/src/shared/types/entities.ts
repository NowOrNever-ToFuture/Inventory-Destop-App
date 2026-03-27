// ─── Domain Entity Types ───────────────────────────────────────────────────
// Derived from src/main/database/migrations/001_init.sql
// Used by BOTH main process (IPC handlers) and renderer (UI / services)

export interface Brand {
  id: string
  name: string
  nameNormalized: string
}

export interface Category {
  id: string
  name: string
  nameNormalized: string
  description?: string
}

export interface Supplier {
  id: string
  name: string
  nameNormalized: string
  phone?: string
  address?: string
  taxCode?: string
}

export interface Product {
  id: string
  model: string
  modelNormalized: string
  name: string
  unit?: string
  stockQuantity: number
  importPrice: number
  categoryId: string
  brandId: string
}

export interface PurchaseOrder {
  id: string
  code: string
  supplierId: string
  orderDate: string
  totalAmount: number
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productId: string
  quantity: number
  unitCost: number
  lineTotal: number
}

export interface SalesOrder {
  id: string
  code: string
  orderDate: string
}

export interface SalesOrderItem {
  id: string
  salesOrderId: string
  productId: string
  quantity: number
}
