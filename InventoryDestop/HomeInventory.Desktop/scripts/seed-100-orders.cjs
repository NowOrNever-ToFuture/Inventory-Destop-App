const path = require('node:path')
const os = require('node:os')
const Database = require('better-sqlite3')

function buildDbPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
  return path.join(appData, 'homeinventory-desktop', 'database', 'homeinventory.sqlite')
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickMany(arr, count) {
  const copy = [...arr]
  const out = []
  for (let i = 0; i < count && copy.length > 0; i += 1) {
    const idx = randomInt(0, copy.length - 1)
    out.push(copy[idx])
    copy.splice(idx, 1)
  }
  return out
}

function toDateString(date) {
  return date.toISOString().slice(0, 10)
}

function randomOrderDateInLastMonths(monthsBack = 24) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
  const ts = randomInt(start.getTime(), now.getTime())
  return toDateString(new Date(ts))
}

function ensureSupplier(db) {
  const first = db.prepare('SELECT id FROM suppliers LIMIT 1').get()
  if (first) return first.id

  const id = crypto.randomUUID()
  db.prepare('INSERT INTO suppliers (id, name, name_normalized, phone) VALUES (?, ?, ?, ?)').run(
    id,
    'Nha cung cap seed',
    'nha cung cap seed',
    '0900000000'
  )
  return id
}

function main() {
  const dbPath = buildDbPath()
  const db = new Database(dbPath)

  const supplierId = ensureSupplier(db)
  const products = db
    .prepare('SELECT id, model, name, stock_quantity, import_price FROM products')
    .all()

  if (products.length === 0) {
    throw new Error('Không có sản phẩm để seed đơn nhập/xuất. Hãy seed sản phẩm trước.')
  }

  const countBeforePO = db.prepare('SELECT COUNT(*) c FROM purchase_orders').get().c
  const countBeforePOI = db.prepare('SELECT COUNT(*) c FROM purchase_order_items').get().c
  const countBeforeSO = db.prepare('SELECT COUNT(*) c FROM sales_orders').get().c
  const countBeforeSOI = db.prepare('SELECT COUNT(*) c FROM sales_order_items').get().c

  const insertPO = db.prepare(
    'INSERT INTO purchase_orders (id, code, supplier_id, order_date, total_amount) VALUES (?, ?, ?, ?, ?)'
  )
  const insertPOI = db.prepare(
    'INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, unit_cost, line_total) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertSO = db.prepare('INSERT INTO sales_orders (id, code, order_date) VALUES (?, ?, ?)')
  const insertSOI = db.prepare(
    'INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity) VALUES (?, ?, ?, ?)'
  )
  const updateStock = db.prepare(
    'UPDATE products SET stock_quantity = ?, import_price = ? WHERE id = ?'
  )

  const mutableProducts = products.map((p) => ({
    ...p,
    stock_quantity: Number(p.stock_quantity || 0),
    import_price: Number(p.import_price || 0)
  }))

  const tx = db.transaction(() => {
    // 100 purchase orders
    for (let i = 1; i <= 100; i += 1) {
      const poId = crypto.randomUUID()
      const poCode = `PN-SEED-${String(i).padStart(4, '0')}`
      const orderDate = randomOrderDateInLastMonths(24)
      const itemCount = randomInt(2, 6)
      const chosen = pickMany(mutableProducts, itemCount)

      let totalAmount = 0

      for (const p of chosen) {
        const qty = randomInt(1, 80)
        const basePrice = p.import_price > 0 ? p.import_price : randomInt(100000, 3000000)
        const unitCost = Math.max(1000, Math.round(basePrice * (0.9 + Math.random() * 0.5)))
        const lineTotal = qty * unitCost

        insertPOI.run(crypto.randomUUID(), poId, p.id, qty, unitCost, lineTotal)
        totalAmount += lineTotal

        const newStock = p.stock_quantity + qty
        p.stock_quantity = newStock
        p.import_price = unitCost
        updateStock.run(newStock, unitCost, p.id)
      }

      insertPO.run(poId, poCode, supplierId, orderDate, totalAmount)
    }

    // 100 sales orders
    for (let i = 1; i <= 100; i += 1) {
      const soId = crypto.randomUUID()
      const soCode = `PX-SEED-${String(i).padStart(4, '0')}`
      const orderDate = randomOrderDateInLastMonths(24)

      const availableProducts = mutableProducts.filter((p) => p.stock_quantity > 0)
      if (availableProducts.length === 0) {
        insertSO.run(soId, soCode, orderDate)
        continue
      }

      const itemCount = randomInt(1, Math.min(5, availableProducts.length))
      const chosen = pickMany(availableProducts, itemCount)

      for (const p of chosen) {
        const qty = randomInt(1, Math.min(30, Math.max(1, Math.floor(p.stock_quantity))))
        insertSOI.run(crypto.randomUUID(), soId, p.id, qty)

        const newStock = Math.max(0, p.stock_quantity - qty)
        p.stock_quantity = newStock
        updateStock.run(newStock, p.import_price, p.id)
      }

      insertSO.run(soId, soCode, orderDate)
    }
  })

  tx()

  const countAfterPO = db.prepare('SELECT COUNT(*) c FROM purchase_orders').get().c
  const countAfterPOI = db.prepare('SELECT COUNT(*) c FROM purchase_order_items').get().c
  const countAfterSO = db.prepare('SELECT COUNT(*) c FROM sales_orders').get().c
  const countAfterSOI = db.prepare('SELECT COUNT(*) c FROM sales_order_items').get().c

  db.close()

  console.log('[seed-orders] dbPath:', dbPath)
  console.log('[seed-orders] purchase_orders:', countBeforePO, '->', countAfterPO)
  console.log('[seed-orders] purchase_order_items:', countBeforePOI, '->', countAfterPOI)
  console.log('[seed-orders] sales_orders:', countBeforeSO, '->', countAfterSO)
  console.log('[seed-orders] sales_order_items:', countBeforeSOI, '->', countAfterSOI)
}

try {
  main()
  process.exit(0)
} catch (error) {
  console.error('[seed-orders] failed:', error)
  process.exit(1)
}
