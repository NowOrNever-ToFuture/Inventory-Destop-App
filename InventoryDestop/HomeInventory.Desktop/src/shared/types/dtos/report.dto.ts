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
