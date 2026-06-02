export interface ImportSummaryDto {
  month: number
  year: number
  totalOrders: number
  totalAmount: number
  totalSalesOrders: number
  totalSalesAmount: number
}

export interface ReportAvailableYearsDto {
  years: number[]
}

export type AvailableYearsResponseDto = number[]

export type TopImportedItemsReportScope = 'month' | 'year'

export interface TopImportedItemsReportRequestDto {
  scope: TopImportedItemsReportScope
  year: number
  month?: number
}

export interface TopImportedItemDto {
  label: string
  quantity: number
}

export interface TopSupplierReportRequestDto {
  scope: 'month' | 'year'
  year: number
  month?: number
}

export interface TopSupplierDto {
  supplierName: string
  totalAmount: number
}
