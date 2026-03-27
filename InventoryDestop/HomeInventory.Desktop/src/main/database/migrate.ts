import type { Database } from 'better-sqlite3'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  tax_code TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  model_normalized TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT,
  stock_quantity REAL NOT NULL DEFAULT 0,
  import_price REAL NOT NULL DEFAULT 0,
  category_id TEXT NOT NULL,
  brand_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  order_date TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  order_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id TEXT PRIMARY KEY,
  sales_order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL
);
`

function ensureBaseSchema(db: Database): void {
  db.exec(BASE_SCHEMA_SQL)
}

function hasColumn(db: Database, table: string, column: string): boolean {
  const rows = db.prepare<[], { name: string }>(`PRAGMA table_info(${table})`).all()
  return rows.some((r) => r.name === column)
}

function ensureLegacySchemaCompatibility(db: Database): void {
  // categories
  if (!hasColumn(db, 'categories', 'name_normalized')) {
    db.exec('ALTER TABLE categories ADD COLUMN name_normalized TEXT')
  }
  db.exec(
    "UPDATE categories SET name_normalized = lower(trim(name)) WHERE name_normalized IS NULL OR trim(name_normalized) = ''"
  )
  db.exec(
    'CREATE INDEX IF NOT EXISTS idx_categories_name_normalized ON categories(name_normalized)'
  )

  // brands
  if (!hasColumn(db, 'brands', 'name_normalized')) {
    db.exec('ALTER TABLE brands ADD COLUMN name_normalized TEXT')
  }
  db.exec(
    "UPDATE brands SET name_normalized = lower(trim(name)) WHERE name_normalized IS NULL OR trim(name_normalized) = ''"
  )
  db.exec('CREATE INDEX IF NOT EXISTS idx_brands_name_normalized ON brands(name_normalized)')

  // suppliers
  if (!hasColumn(db, 'suppliers', 'name_normalized')) {
    db.exec('ALTER TABLE suppliers ADD COLUMN name_normalized TEXT')
  }
  db.exec(
    "UPDATE suppliers SET name_normalized = lower(trim(name)) WHERE name_normalized IS NULL OR trim(name_normalized) = ''"
  )
  db.exec('CREATE INDEX IF NOT EXISTS idx_suppliers_name_normalized ON suppliers(name_normalized)')

  // products
  if (!hasColumn(db, 'products', 'model_normalized')) {
    db.exec('ALTER TABLE products ADD COLUMN model_normalized TEXT')
  }
  db.exec(
    "UPDATE products SET model_normalized = lower(trim(model)) WHERE model_normalized IS NULL OR trim(model_normalized) = ''"
  )
  db.exec('CREATE INDEX IF NOT EXISTS idx_products_model_normalized ON products(model_normalized)')
}

/**
 * Runs all pending SQL migration files in the migrations/ directory.
 * Files must be named `<number>_<description>.sql` and will be executed in
 * ascending numeric order. Each file is executed only once (tracked via the
 * `schema_migrations` table in the database itself).
 */
export function runMigrations(db: Database): void {
  // Always bootstrap base schema first to avoid runtime crashes when
  // migration files are not copied to packaged output.
  ensureBaseSchema(db)

  // Ensure tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const migrationsDir = join(__dirname, 'migrations')

  let files: string[]
  try {
    files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
  } catch {
    console.warn('[migrate] No migrations directory found at', migrationsDir)
    files = []
  }

  const appliedStmt = db.prepare<string[], { filename: string }>(
    'SELECT filename FROM schema_migrations WHERE filename = ?'
  )
  const markAppliedStmt = db.prepare<[string], void>(
    'INSERT INTO schema_migrations (filename) VALUES (?)'
  )

  for (const file of files) {
    const already = appliedStmt.get(file)
    if (already) continue

    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    console.info(`[migrate] Applying ${file}...`)

    db.transaction(() => {
      db.exec(sql)
      markAppliedStmt.run(file)
    })()

    console.info(`[migrate] ${file} applied.`)
  }

  // Make old local DBs compatible with current code.
  // This avoids runtime SQLite errors when users already have legacy schema.
  ensureLegacySchemaCompatibility(db)
}
