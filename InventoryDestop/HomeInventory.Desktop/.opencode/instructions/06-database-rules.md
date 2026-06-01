# 06 - Database Rules

## SQLite Setup

- Database lưu tại: `app.getPath('userData')/database/homeinventory.sqlite`
- WAL mode được bật: `db.pragma('journal_mode = WAL')`
- Mở DB: `src/infrastructure/database/db.ts` → `openDb()`
- Migrations: `src/infrastructure/database/migrate.ts` → `runMigrations(db)`

## Migration Rules

### Tạo migration mới

1. Tạo file `src/infrastructure/database/migrations/00N_description.sql`
2. Đặt tên theo pattern: `001_init.sql`, `002_add_warehouses.sql`, `003_convert_money.sql`
3. Migrations chạy theo thứ tự alphabetical
4. Mỗi migration chỉ chạy một lần (tracked bởi bảng `schema_migrations`)

### Migration file template

```sql
-- Migration: Mô tả ngắn gọn

-- Thêm bảng mới
CREATE TABLE IF NOT EXISTS my_table (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Thêm cột vào bảng có sẵn
ALTER TABLE products ADD COLUMN new_field TEXT;

-- Tạo index
CREATE INDEX IF NOT EXISTS idx_my_table_name ON my_table(name_normalized);
```

### Base Schema

`migrate.ts` có hardcoded base schema để tránh crash khi migrations không được copy vào packaged app. Khi thêm bảng mới, cần thêm vào cả:
1. Migration SQL file
2. `BASE_SCHEMA_SQL` trong `migrate.ts`

## Money Storage

**Bắt buộc**: Tất cả giá trị tiền lưu dưới dạng INTEGER (cents = value × 100)

```ts
import { toMoneyInt, fromMoneyInt } from '@shared/utils/money'

// Khi INSERT/UPDATE
const priceToStore = toMoneyInt(displayPrice)  // 100.50 → 10050

// Khi SELECT
const displayPrice = fromMoneyInt(storedValue)  // 10050 → 100.50
```

**Các cột tiền hiện tại:**
- `products.import_price` - INTEGER
- `purchase_order_items.unit_cost` - INTEGER
- `purchase_order_items.line_total` - INTEGER
- `purchase_orders.total_amount` - INTEGER

## Text Normalization

Dùng cho search không dấu/case-insensitive:

```ts
import { normalizeSearchText } from '@shared/utils/text-normalize'

// Khi INSERT/UPDATE - lưu normalized version
const nameNormalized = normalizeSearchText(name)

// Khi SELECT - normalize search keyword
const keyword = normalizeSearchText(searchInput)
const rows = db.prepare('SELECT * FROM products WHERE name_normalized LIKE ?').all(`%${keyword}%`)
```

**Các cột normalized hiện tại:**
- `brands.name_normalized`
- `categories.name_normalized`
- `suppliers.name_normalized`
- `products.model_normalized`, `products.name_normalized`

## Repository Pattern

### Row type (internal)

```ts
// Định nghĩa shape của DB row - snake_case
interface ProductRow {
  id: string
  model: string
  model_normalized: string
  import_price: number  // INTEGER cents
  category_id: string
}
```

### toResponse mapper

```ts
// Convert DB row → DTO (snake_case → camelCase, cents → display)
function toResponse(row: ProductRow): ProductResponseDto {
  return {
    id: row.id,
    model: row.model,
    importPrice: fromMoneyInt(row.import_price),  // chia 100
    categoryId: row.category_id,
  }
}
```

### ID Generation

```ts
private generateUniqueId(): string {
  let id = crypto.randomUUID()
  while (this.db.prepare('SELECT id FROM my_table WHERE id = ?').get(id)) {
    id = crypto.randomUUID()
  }
  return id
}
```

### Transaction

```ts
// Dùng transaction cho operations liên quan
this.db.transaction(() => {
  insertStmt.run(...)
  updateStmt.run(...)
})()
```

### Async/Await với better-sqlite3

`better-sqlite3` là synchronous. Methods đặt tên `Async` để API promise-compatible qua IPC, nhưng implementation là sync:

```ts
// ✅ Đúng pattern
async getAllAsync(): Promise<ProductResponseDto[]> {
  const rows = this.db.prepare('SELECT * FROM products').all()
  return rows.map(toResponse)
}
```

### Tránh async-await-in-loop

```ts
// ✅ Dùng Promise.all cho parallel operations
const resolvedItems = await Promise.all(
  request.items.map(async (item) => {
    const product = await this.productService.createAsync(item)
    return { productId: product.id, ... }
  })
)

// ❌ Sequential await trong for loop
for (const item of request.items) {
  const product = await this.productService.createAsync(item)  // slow
}
```

### Tránh map().filter()

```ts
// ✅ Single pass với reduce
return rows.reduce<MyDto[]>((acc, row) => {
  if (row.quantity > 0) acc.push({ label: row.name, quantity: row.quantity })
  return acc
}, [])

// ❌ Double pass
return rows.map(toDto).filter(item => item.quantity > 0)
```

## Indexes

Luôn tạo index cho các cột dùng trong WHERE/ORDER BY:

```sql
CREATE INDEX IF NOT EXISTS idx_products_model_normalized ON products(model_normalized);
CREATE INDEX IF NOT EXISTS idx_products_name_normalized ON products(name_normalized);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);
```
