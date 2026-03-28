export interface ImportSummaryDto {
  month: number
  year: number
  totalOrders: number
  totalAmount: number
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
