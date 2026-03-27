// ── PurchaseOrder (aggregate) ─────────────────────────────────────────────

export interface PurchaseOrderItemRequestDto {
  model: string
  name: string
  unit?: string
  quantity: number
  unitCost: number
  categoryId: string
  brandId: string
}

export interface PurchaseOrderRequestDto {
  code?: string
  orderDate?: string
  supplierId: string
  items: PurchaseOrderItemRequestDto[]
}

export interface PurchaseOrderItemResponseDto {
  productId: string
  quantity: number
  unitCost: number
  lineTotal: number
}

export interface PurchaseOrderResponseDto {
  id: string
  code: string
  orderDate: string
  supplierId: string
  totalAmount: number
  items: PurchaseOrderItemResponseDto[]
}

// ── PurchaseOrderItem (standalone) ────────────────────────────────────────

export interface StandalonePurchaseOrderItemRequestDto {
  purchaseOrderId: string
  productId: string
  quantity: number
  unitCost: number
}

export interface StandalonePurchaseOrderItemResponseDto {
  id: string
  purchaseOrderId: string
  productId: string
  quantity: number
  unitCost: number
  lineTotal: number
}
