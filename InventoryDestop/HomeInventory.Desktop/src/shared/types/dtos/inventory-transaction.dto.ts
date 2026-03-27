export interface InventoryTransactionRequestDto {
  productId: string
  warehouseId: string
  type: 'IN' | 'OUT'
  quantity: number
  note?: string
}

export interface InventoryTransactionResponseDto {
  id: string
  productId: string
  warehouseId: string
  type: 'IN' | 'OUT'
  quantity: number
  note?: string
  transactionDate: string
}
