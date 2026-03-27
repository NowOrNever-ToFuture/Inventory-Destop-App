import type { Database } from 'better-sqlite3'
import type {
  ProductGetAllQueryDto,
  ProductGetAllResponseDto,
  ProductRequestDto,
  ProductResponseDto
} from '@shared/types/dtos/product.dto'
import { MAX_MONEY, MAX_MONEY_ERROR_MESSAGE } from '@shared/constants'

interface ProductRow {
  id: string
  model: string
  model_normalized: string
  name: string
  unit: string | null
  stock_quantity: number
  import_price: number
  category_id: string
  brand_id: string
}

function toResponse(row: ProductRow): ProductResponseDto {
  return {
    id: row.id,
    model: row.model,
    name: row.name,
    ...(row.unit != null ? { unit: row.unit } : {}),
    stockQuantity: row.stock_quantity,
    importPrice: row.import_price,
    categoryId: row.category_id,
    brandId: row.brand_id
  }
}

// ── ProductService ─────────────────────────────────────────────────────────

export class ProductService {
  constructor(private readonly db: Database) {}

  private resolveImportPrice(value: number | null | undefined, fallback = 0): number {
    if (value == null) return fallback
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Giá nhập không hợp lệ')
    }
    if (value > MAX_MONEY) {
      throw new Error(MAX_MONEY_ERROR_MESSAGE)
    }
    return value
  }

  private generateUniqueId(): string {
    let id = crypto.randomUUID()
    while (
      this.db.prepare<[string], { id: string }>('SELECT id FROM products WHERE id = ?').get(id)
    ) {
      id = crypto.randomUUID()
    }
    return id
  }

  private normalizeValue(value: string): string {
    return value.trim().toLowerCase()
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/([\\%_])/g, '\\$1')
  }

  private buildSearchClause(search?: string): { clause: string; params: unknown[] } {
    const keyword = search?.trim()
    if (!keyword) {
      return { clause: '', params: [] }
    }

    const normalized = this.normalizeValue(keyword)
    if (normalized.length === 1) {
      const prefix = `${this.escapeLikePattern(normalized)}%`
      return {
        clause: `(lower(name) LIKE ? ESCAPE '\\' OR model_normalized LIKE ? ESCAPE '\\')`,
        params: [prefix, prefix]
      }
    }

    const contains = `%${this.escapeLikePattern(normalized)}%`
    return {
      clause: `(lower(name) LIKE ? ESCAPE '\\' OR lower(model) LIKE ? ESCAPE '\\' OR model_normalized LIKE ? ESCAPE '\\')`,
      params: [contains, contains, contains]
    }
  }

  async getAllAsync(query?: ProductGetAllQueryDto): Promise<ProductGetAllResponseDto> {
    const conditions: string[] = []
    const params: unknown[] = []

    if (query?.categoryId) {
      conditions.push('category_id = ?')
      params.push(query.categoryId)
    }

    const search = this.buildSearchClause(query?.search)
    if (search.clause) {
      conditions.push(search.clause)
      params.push(...search.params)
    }

    const page = Math.max(1, query?.page ?? 1)
    const pageSize = Math.max(1, query?.pageSize ?? 20)
    const offset = (page - 1) * pageSize

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const totalRow = this.db
      .prepare<unknown[], { total: number }>(`SELECT COUNT(*) as total FROM products ${where}`)
      .get(...params)

    const total = totalRow?.total ?? 0
    const searchKeyword = query?.search?.trim()
    if (searchKeyword && total === 0) {
      const categoryMessage = query?.categoryId ? ' trong danh mục đã chọn' : ''
      throw new Error(`Không tìm thấy dữ liệu phù hợp${categoryMessage}`)
    }

    const pagedRows = this.db
      .prepare<
        unknown[],
        ProductRow
      >(`SELECT * FROM products ${where} ORDER BY name LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset)

    return {
      items: pagedRows.map(toResponse),
      total,
      page,
      pageSize
    }
  }

  /** Returns up to `limit` products whose model or name contains `keyword` */
  async suggestAsync(keyword: string, limit = 10): Promise<ProductResponseDto[]> {
    const pattern = `%${keyword.trim().toLowerCase()}%`
    const rows = this.db
      .prepare<[string, string, number], ProductRow>(
        `SELECT * FROM products
         WHERE model_normalized LIKE ? OR lower(name) LIKE ?
         ORDER BY name LIMIT ?`
      )
      .all(pattern, pattern, limit)
    return rows.map(toResponse)
  }

  async getByIdAsync(id: string): Promise<ProductResponseDto | null> {
    const row = this.db.prepare<[string], ProductRow>('SELECT * FROM products WHERE id = ?').get(id)
    return row ? toResponse(row) : null
  }

  async createAsync(request: ProductRequestDto): Promise<ProductResponseDto> {
    const modelNormalized = this.normalizeValue(request.model)
    const nameNormalized = this.normalizeValue(request.name)
    const importPrice = this.resolveImportPrice(request.importPrice, 0)

    const duplicate = this.db
      .prepare<
        [string, string],
        { id: string; model: string; name: string }
      >('SELECT id, model, name FROM products WHERE model_normalized = ? OR lower(trim(name)) = ?')
      .get(modelNormalized, nameNormalized)

    if (duplicate) {
      throw new Error('Sản phẩm đã tồn tại')
    }

    const id = this.generateUniqueId()

    this.db
      .prepare<
        [string, string, string, string, string | null, number, number, string, string],
        void
      >(
        `INSERT INTO products
           (id, model, model_normalized, name, unit, stock_quantity, import_price, category_id, brand_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        request.model.trim(),
        modelNormalized,
        request.name.trim(),
        request.unit ?? null,
        request.stockQuantity,
        importPrice,
        request.categoryId,
        request.brandId
      )

    return (await this.getByIdAsync(id))!
  }

  async updateAsync(id: string, request: ProductRequestDto): Promise<ProductResponseDto> {
    const existing = this.db
      .prepare<[string], ProductRow>('SELECT * FROM products WHERE id = ?')
      .get(id)

    if (!existing) {
      throw new Error(`Product with id "${id}" not found.`)
    }

    const modelNormalized = this.normalizeValue(request.model)
    const nameNormalized = this.normalizeValue(request.name)
    const importPrice = this.resolveImportPrice(request.importPrice, existing.import_price)

    const duplicate = this.db
      .prepare<
        [string, string, string],
        { id: string; model: string; name: string }
      >('SELECT id, model, name FROM products WHERE (model_normalized = ? OR lower(trim(name)) = ?) AND id != ?')
      .get(modelNormalized, nameNormalized, id)

    if (duplicate) {
      throw new Error('Sản phẩm đã tồn tại')
    }

    this.db
      .prepare<
        [string, string, string, string | null, number, number, string, string, string],
        void
      >(
        `UPDATE products
         SET model = ?, model_normalized = ?, name = ?, unit = ?,
             stock_quantity = ?, import_price = ?, category_id = ?, brand_id = ?
         WHERE id = ?`
      )
      .run(
        request.model.trim(),
        modelNormalized,
        request.name.trim(),
        request.unit ?? null,
        request.stockQuantity,
        importPrice,
        request.categoryId,
        request.brandId,
        id
      )

    return (await this.getByIdAsync(id))!
  }

  async deleteAsync(id: string): Promise<boolean> {
    const result = this.db.prepare<[string], void>('DELETE FROM products WHERE id = ?').run(id)
    return result.changes > 0
  }
}
