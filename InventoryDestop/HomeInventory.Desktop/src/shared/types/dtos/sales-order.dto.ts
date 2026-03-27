// ── SalesOrder (aggregate) ────────────────────────────────────────────────

export interface SalesOrderItemRequestDto {
  productId: string
  quantity: number
}

export interface SalesOrderRequestDto {
  code?: string
  items: SalesOrderItemRequestDto[]
}

export interface SalesOrderItemResponseDto {
  productId: string
  quantity: number
}

export interface SalesOrderResponseDto {
  id: string
  code: string
  orderDate: string
  items: SalesOrderItemResponseDto[]
}

// ── SalesOrderItem (standalone) ───────────────────────────────────────────

export interface StandaloneSalesOrderItemRequestDto {
  salesOrderId: string
  productId: string
  quantity: number
}

export interface StandaloneSalesOrderItemResponseDto {
  id: string
  salesOrderId: string
  productId: string
  quantity: number
}
