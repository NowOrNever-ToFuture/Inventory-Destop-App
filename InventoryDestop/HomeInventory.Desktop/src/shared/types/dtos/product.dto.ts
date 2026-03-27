export interface ProductRequestDto {
  model: string
  name: string
  unit?: string
  categoryId: string
  brandId: string
  stockQuantity: number
  importPrice?: number | null
}

export interface ProductGetAllQueryDto {
  search?: string
  categoryId?: string
  page?: number
  pageSize?: number
}

export interface ProductResponseDto {
  id: string
  model: string
  name: string
  unit?: string
  categoryId: string
  brandId: string
  stockQuantity: number
  importPrice: number
}

export interface ProductGetAllResponseDto {
  items: ProductResponseDto[]
  total: number
  page: number
  pageSize: number
}

export interface ProductListQueryDto {
  search?: string
  categoryId?: string
  page?: number
  pageSize?: number
}

export interface ProductListResponseDto {
  items: ProductResponseDto[]
  total: number
  page: number
  pageSize: number
}
