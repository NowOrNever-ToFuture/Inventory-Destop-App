const path = require('node:path')
const os = require('node:os')
const Database = require('better-sqlite3')

function normalizeText(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function buildDbPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
  return path.join(appData, 'homeinventory-desktop', 'database', 'homeinventory.sqlite')
}

function main() {
  const dbPath = buildDbPath()
  const db = new Database(dbPath)

  const categories = db.prepare('SELECT id FROM categories').all()
  const brands = db.prepare('SELECT id FROM brands').all()
  const templates = db
    .prepare('SELECT model, name, unit, category_id, brand_id FROM products LIMIT 30')
    .all()

  if (categories.length === 0 || brands.length === 0) {
    throw new Error('Thiếu dữ liệu danh mục/hãng. Hãy tạo category + brand trước khi seed.')
  }

  const insert = db.prepare(`
    INSERT INTO products (
      id, model, model_normalized, name, name_normalized,
      unit, stock_quantity, import_price, category_id, brand_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const countBefore = db.prepare('SELECT COUNT(*) as c FROM products').get().c
  let inserted = 0
  const now = Date.now()

  const tx = db.transaction(() => {
    for (let i = 1; i <= 100; i += 1) {
      const t = templates[(i - 1) % Math.max(templates.length, 1)] || {
        model: 'SP',
        name: 'San pham',
        unit: 'Cái',
        category_id: categories[(i - 1) % categories.length].id,
        brand_id: brands[(i - 1) % brands.length].id
      }

      const suffix = `${String(now).slice(-6)}${String(i).padStart(3, '0')}`
      const model = `${String(t.model || 'SP').trim()}-${suffix}`
      const name = `${String(t.name || 'Sản phẩm').trim()} mẫu ${i}`

      const id = crypto.randomUUID()
      const modelNormalized = normalizeText(model)
      const nameNormalized = normalizeText(name)
      const stockQuantity = (i % 40) + 1
      const importPrice = ((i % 90) + 10) * 100000

      insert.run(
        id,
        model,
        modelNormalized,
        name,
        nameNormalized,
        t.unit || 'Cái',
        stockQuantity,
        importPrice,
        t.category_id || categories[(i - 1) % categories.length].id,
        t.brand_id || brands[(i - 1) % brands.length].id
      )
      inserted += 1
    }
  })

  tx()

  const countAfter = db.prepare('SELECT COUNT(*) as c FROM products').get().c
  db.close()

  console.log('[seed] dbPath:', dbPath)
  console.log('[seed] inserted:', inserted)
  console.log('[seed] products before:', countBefore)
  console.log('[seed] products after:', countAfter)
}

try {
  main()
} catch (error) {
  console.error('[seed] failed:', error)
  process.exit(1)
}
