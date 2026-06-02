import ExcelJS from 'exceljs'
import type { Database } from 'better-sqlite3'
import { app, dialog, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { fromMoneyInt } from '@shared/utils/money'

// ── Row types ──────────────────────────────────────────────────────────────

interface PurchaseReportRow {
  order_code: string
  order_date: string
  supplier_name: string
  product_model: string
  product_name: string
  quantity: number
  unit_cost: number
  line_total: number
}

interface SalesReportRow {
  order_code: string
  order_date: string
  product_model: string
  product_name: string
  quantity: number
}

interface InventoryRow {
  model: string
  name: string
  unit: string | null
  stock_quantity: number
  import_price: number
  category_name: string
  brand_name: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const VND_FORMAT = '#,##0 "₫"'
const FONT_BASE = 'Times New Roman'
const HEADER_COLOR = 'FF2563EB'
const TOTAL_COLOR = 'FFF0F4FF'

function styleHeader(worksheet: ExcelJS.Worksheet): void {
  const row = worksheet.getRow(1)
  row.height = 24
  row.eachCell((cell) => {
    cell.font = { name: FONT_BASE, size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB0C4DE' } },
      left: { style: 'thin', color: { argb: 'FFB0C4DE' } },
      bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } },
      right: { style: 'thin', color: { argb: 'FFB0C4DE' } }
    }
  })
}

function styleDataRows(worksheet: ExcelJS.Worksheet): void {
  worksheet.eachRow((row, rowNum) => {
    if (rowNum === 1) return
    row.eachCell((cell) => {
      if (!cell.font?.bold) {
        cell.font = { name: FONT_BASE, size: 11 }
      }
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFD0D0D0' } },
        left: { style: 'hair', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'hair', color: { argb: 'FFD0D0D0' } },
        right: { style: 'hair', color: { argb: 'FFD0D0D0' } }
      }
    })
  })
}

function styleTotalRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.font = { name: FONT_BASE, size: 11, bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_COLOR } }
  })
}

function moneyCell(cell: ExcelJS.Cell): void {
  cell.numFmt = VND_FORMAT
  cell.alignment = { horizontal: 'right' }
}

// ── ExcelExportService ─────────────────────────────────────────────────────

export class ExcelExportService {
  constructor(private readonly db: Database) {}

  // ── 1. Báo cáo nhập hàng ────────────────────────────────────────────────

  async exportPurchaseReport(year?: number): Promise<string | null> {
    const where = year ? `WHERE po.order_date LIKE '${year}-%'` : ''
    const rows = this.db
      .prepare<[], PurchaseReportRow>(
        `
      SELECT po.code AS order_code, po.order_date,
             s.name AS supplier_name,
             p.model AS product_model, p.name AS product_name,
             poi.quantity, poi.unit_cost, poi.line_total
      FROM purchase_order_items poi
      INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id
      INNER JOIN suppliers s ON s.id = po.supplier_id
      INNER JOIN products p ON p.id = poi.product_id
      ${where}
      ORDER BY po.order_date DESC, po.code
    `
      )
      .all()

    const wb = new ExcelJS.Workbook()
    wb.creator = 'HomeInventory'
    wb.created = new Date()

    const ws = wb.addWorksheet('Báo cáo nhập hàng')
    ws.columns = [
      { header: 'Mã phiếu', key: 'orderCode', width: 16 },
      { header: 'Ngày nhập', key: 'orderDate', width: 14 },
      { header: 'Đại lý phân phối', key: 'supplierName', width: 28 },
      { header: 'Mã sản phẩm', key: 'productModel', width: 18 },
      { header: 'Tên sản phẩm', key: 'productName', width: 30 },
      { header: 'Số lượng', key: 'quantity', width: 12 },
      { header: 'Đơn giá (VNĐ)', key: 'unitCost', width: 20 },
      { header: 'Thành tiền (VNĐ)', key: 'lineTotal', width: 22 }
    ]

    let totalSpent = 0
    for (const r of rows) {
      const unitCost = fromMoneyInt(r.unit_cost)
      const lineTotal = fromMoneyInt(r.line_total)
      totalSpent += lineTotal
      ws.addRow({
        orderCode: r.order_code,
        orderDate: r.order_date,
        supplierName: r.supplier_name,
        productModel: r.product_model,
        productName: r.product_name,
        quantity: r.quantity,
        unitCost,
        lineTotal
      })
    }

    const totalRow = ws.addRow({
      orderCode: '',
      orderDate: '',
      supplierName: '',
      productModel: '',
      productName: 'TỔNG CỘNG',
      quantity: rows.reduce((s, r) => s + r.quantity, 0),
      unitCost: '',
      lineTotal: totalSpent
    })
    styleTotalRow(totalRow)

    styleHeader(ws)
    styleDataRows(ws)

    ws.getColumn('unitCost').eachCell((cell, n) => {
      if (n > 1) moneyCell(cell)
    })
    ws.getColumn('lineTotal').eachCell((cell, n) => {
      if (n > 1) moneyCell(cell)
    })
    ws.getColumn('quantity').alignment = { horizontal: 'right' }

    const result = await dialog.showSaveDialog(BrowserWindow.getAllWindows()[0]!, {
      title: 'Xuất báo cáo nhập hàng',
      defaultPath: join(
        app.getPath('documents'),
        `bao-cao-nhap-hang${year ? `-${year}` : ''}.xlsx`
      ),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    await wb.xlsx.writeFile(result.filePath)
    return result.filePath
  }

  // ── 2. Báo cáo xuất hàng ────────────────────────────────────────────────

  async exportSalesReport(year?: number): Promise<string | null> {
    const where = year ? `WHERE so.order_date LIKE '${year}-%'` : ''
    const rows = this.db
      .prepare<[], SalesReportRow>(
        `
      SELECT so.code AS order_code, so.order_date,
             p.model AS product_model, p.name AS product_name,
             soi.quantity
      FROM sales_order_items soi
      INNER JOIN sales_orders so ON so.id = soi.sales_order_id
      INNER JOIN products p ON p.id = soi.product_id
      ${where}
      ORDER BY so.order_date DESC, so.code
    `
      )
      .all()

    const wb = new ExcelJS.Workbook()
    wb.creator = 'HomeInventory'
    wb.created = new Date()

    const ws = wb.addWorksheet('Báo cáo xuất hàng')
    ws.columns = [
      { header: 'Mã phiếu', key: 'orderCode', width: 16 },
      { header: 'Ngày xuất', key: 'orderDate', width: 14 },
      { header: 'Mã sản phẩm', key: 'productModel', width: 18 },
      { header: 'Tên sản phẩm', key: 'productName', width: 30 },
      { header: 'Số lượng', key: 'quantity', width: 12 }
    ]

    let totalQty = 0
    for (const r of rows) {
      totalQty += r.quantity
      ws.addRow({
        orderCode: r.order_code,
        orderDate: r.order_date,
        productModel: r.product_model,
        productName: r.product_name,
        quantity: r.quantity
      })
    }

    const totalRow = ws.addRow({
      orderCode: '',
      orderDate: '',
      productModel: '',
      productName: 'TỔNG CỘNG',
      quantity: totalQty
    })
    styleTotalRow(totalRow)

    styleHeader(ws)
    styleDataRows(ws)
    ws.getColumn('quantity').alignment = { horizontal: 'right' }

    const result = await dialog.showSaveDialog(BrowserWindow.getAllWindows()[0]!, {
      title: 'Xuất báo cáo xuất hàng',
      defaultPath: join(
        app.getPath('documents'),
        `bao-cao-xuat-hang${year ? `-${year}` : ''}.xlsx`
      ),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    await wb.xlsx.writeFile(result.filePath)
    return result.filePath
  }

  // ── 3. Tồn kho ──────────────────────────────────────────────────────────

  async exportInventoryReport(): Promise<string | null> {
    const rows = this.db
      .prepare<[], InventoryRow>(
        `
      SELECT p.model, p.name, p.unit, p.stock_quantity, p.import_price,
             c.name AS category_name, b.name AS brand_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ORDER BY c.name, b.name, p.model
    `
      )
      .all()

    const wb = new ExcelJS.Workbook()
    wb.creator = 'HomeInventory'
    wb.created = new Date()

    const ws = wb.addWorksheet('Tồn kho')
    ws.columns = [
      { header: 'Mã sản phẩm', key: 'model', width: 20 },
      { header: 'Tên sản phẩm', key: 'name', width: 32 },
      { header: 'Danh mục', key: 'category', width: 18 },
      { header: 'Hãng', key: 'brand', width: 16 },
      { header: 'ĐVT', key: 'unit', width: 10 },
      { header: 'Tồn kho', key: 'stockQty', width: 12 },
      { header: 'Giá nhập (VNĐ)', key: 'importPrice', width: 22 },
      { header: 'Giá trị tồn (VNĐ)', key: 'stockValue', width: 24 }
    ]

    let totalValue = 0
    let totalQty = 0
    for (const r of rows) {
      const importPrice = fromMoneyInt(r.import_price)
      const stockValue = r.stock_quantity * importPrice
      totalValue += stockValue
      totalQty += r.stock_quantity
      ws.addRow({
        model: r.model,
        name: r.name,
        category: r.category_name,
        brand: r.brand_name,
        unit: r.unit ?? 'Cái',
        stockQty: r.stock_quantity,
        importPrice,
        stockValue
      })
    }

    const totalRow = ws.addRow({
      model: '',
      name: 'TỔNG CỘNG',
      category: '',
      brand: '',
      unit: '',
      stockQty: totalQty,
      importPrice: '',
      stockValue: totalValue
    })
    styleTotalRow(totalRow)

    styleHeader(ws)
    styleDataRows(ws)

    ws.getColumn('importPrice').eachCell((cell, n) => {
      if (n > 1) moneyCell(cell)
    })
    ws.getColumn('stockValue').eachCell((cell, n) => {
      if (n > 1) moneyCell(cell)
    })
    ws.getColumn('stockQty').alignment = { horizontal: 'right' }

    const result = await dialog.showSaveDialog(BrowserWindow.getAllWindows()[0]!, {
      title: 'Xuất báo cáo tồn kho',
      defaultPath: join(app.getPath('documents'), 'bao-cao-ton-kho.xlsx'),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    await wb.xlsx.writeFile(result.filePath)
    return result.filePath
  }

  // ── 4. Báo cáo tổng hợp năm/tháng ──────────────────────────────────────

  async exportYearlyReport(year?: number): Promise<string | null> {
    const whereYear = year ? `AND CAST(strftime('%Y', po.order_date) AS INTEGER) = ${year}` : ''
    const whereYearSO = year ? `AND CAST(strftime('%Y', so.order_date) AS INTEGER) = ${year}` : ''

    const importRows = this.db
      .prepare<[], { year: number; month: number; cnt: number; total: number }>(
        `
      SELECT CAST(strftime('%Y', order_date) AS INTEGER) AS year,
             CAST(strftime('%m', order_date) AS INTEGER) AS month,
             COUNT(*) AS cnt,
             COALESCE(SUM(total_amount), 0) AS total
      FROM purchase_orders
      WHERE order_date IS NOT NULL ${year ? `AND order_date LIKE '${year}-%'` : ''}
      GROUP BY year, month
      ORDER BY year, month
    `
      )
      .all()

    const salesRows = this.db
      .prepare<[], { year: number; month: number; cnt: number }>(
        `
      SELECT CAST(strftime('%Y', order_date) AS INTEGER) AS year,
             CAST(strftime('%m', order_date) AS INTEGER) AS month,
             COUNT(*) AS cnt
      FROM sales_orders
      WHERE order_date IS NOT NULL ${year ? `AND order_date LIKE '${year}-%'` : ''}
      GROUP BY year, month
      ORDER BY year, month
    `
      )
      .all()

    // Build lookup map for sales
    const salesMap = new Map<string, { cnt: number }>()
    for (const r of salesRows) salesMap.set(`${r.year}-${r.month}`, { cnt: r.cnt })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'HomeInventory'
    wb.created = new Date()

    const ws = wb.addWorksheet('Báo cáo tổng hợp')
    ws.columns = [
      { header: 'Năm', key: 'year', width: 10 },
      { header: 'Tháng', key: 'month', width: 10 },
      { header: 'Giá trị Nhập (VNĐ)', key: 'importAmount', width: 26 },
      { header: 'Số phiếu nhập', key: 'importOrders', width: 16 },
      { header: 'Số phiếu xuất', key: 'salesOrders', width: 16 }
    ]

    let totalImport = 0
    let totalImportOrders = 0
    let totalSalesOrders = 0

    for (const r of importRows) {
      const importAmount = fromMoneyInt(r.total)
      const salesInfo = salesMap.get(`${r.year}-${r.month}`)
      totalImport += importAmount
      totalImportOrders += r.cnt
      totalSalesOrders += salesInfo?.cnt ?? 0
      ws.addRow({
        year: r.year,
        month: `Tháng ${r.month}`,
        importAmount,
        importOrders: r.cnt,
        salesOrders: salesInfo?.cnt ?? 0
      })
    }

    const totalRow = ws.addRow({
      year: '',
      month: 'TỔNG CỘNG',
      importAmount: totalImport,
      importOrders: totalImportOrders,
      salesOrders: totalSalesOrders
    })
    styleTotalRow(totalRow)

    styleHeader(ws)
    styleDataRows(ws)

    ws.getColumn('importAmount').eachCell((cell, n) => {
      if (n > 1) moneyCell(cell)
    })
    ws.getColumn('importOrders').alignment = { horizontal: 'right' }
    ws.getColumn('salesOrders').alignment = { horizontal: 'right' }

    // Suppress unused variable warnings
    void whereYear
    void whereYearSO

    const result = await dialog.showSaveDialog(BrowserWindow.getAllWindows()[0]!, {
      title: 'Xuất báo cáo tổng hợp',
      defaultPath: join(app.getPath('documents'), `bao-cao-tong-hop${year ? `-${year}` : ''}.xlsx`),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    await wb.xlsx.writeFile(result.filePath)
    return result.filePath
  }

  // ── 5. Báo cáo nhập hàng theo tháng ────────────────────────────────────

  async exportPurchaseByMonth(year: number, month: number): Promise<string | null> {
    const monthStr = String(month).padStart(2, '0')
    const prefix = `${year}-${monthStr}-%`

    const rows = this.db
      .prepare<[string], PurchaseReportRow>(
        `
      SELECT po.code AS order_code, po.order_date,
             s.name AS supplier_name,
             p.model AS product_model, p.name AS product_name,
             poi.quantity, poi.unit_cost, poi.line_total
      FROM purchase_order_items poi
      INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id
      INNER JOIN suppliers s ON s.id = po.supplier_id
      INNER JOIN products p ON p.id = poi.product_id
      WHERE po.order_date LIKE ?
      ORDER BY po.order_date, po.code
    `
      )
      .all(prefix)

    const wb = new ExcelJS.Workbook()
    wb.creator = 'HomeInventory'
    wb.created = new Date()

    const ws = wb.addWorksheet(`Nhập hàng T${month}-${year}`)
    ws.columns = [
      { header: 'Mã phiếu', key: 'orderCode', width: 16 },
      { header: 'Ngày nhập', key: 'orderDate', width: 14 },
      { header: 'Đại lý phân phối', key: 'supplierName', width: 28 },
      { header: 'Mã sản phẩm', key: 'productModel', width: 18 },
      { header: 'Tên sản phẩm', key: 'productName', width: 30 },
      { header: 'Số lượng', key: 'quantity', width: 12 },
      { header: 'Đơn giá (VNĐ)', key: 'unitCost', width: 20 },
      { header: 'Thành tiền (VNĐ)', key: 'lineTotal', width: 22 }
    ]

    let totalSpent = 0
    for (const r of rows) {
      const unitCost = fromMoneyInt(r.unit_cost)
      const lineTotal = fromMoneyInt(r.line_total)
      totalSpent += lineTotal
      ws.addRow({
        orderCode: r.order_code,
        orderDate: r.order_date,
        supplierName: r.supplier_name,
        productModel: r.product_model,
        productName: r.product_name,
        quantity: r.quantity,
        unitCost,
        lineTotal
      })
    }

    const totalRow = ws.addRow({
      orderCode: '',
      orderDate: '',
      supplierName: '',
      productModel: '',
      productName: 'TỔNG CỘNG',
      quantity: rows.reduce((s, r) => s + r.quantity, 0),
      unitCost: '',
      lineTotal: totalSpent
    })
    styleTotalRow(totalRow)
    styleHeader(ws)
    styleDataRows(ws)
    ws.getColumn('unitCost').eachCell((cell, n) => {
      if (n > 1) moneyCell(cell)
    })
    ws.getColumn('lineTotal').eachCell((cell, n) => {
      if (n > 1) moneyCell(cell)
    })
    ws.getColumn('quantity').alignment = { horizontal: 'right' }

    const result = await dialog.showSaveDialog(BrowserWindow.getAllWindows()[0]!, {
      title: `Xuất nhập hàng tháng ${month}/${year}`,
      defaultPath: join(app.getPath('documents'), `nhap-hang-T${monthStr}-${year}.xlsx`),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    await wb.xlsx.writeFile(result.filePath)
    return result.filePath
  }

  // ── 6. Báo cáo xuất hàng theo tháng ────────────────────────────────────

  async exportSalesByMonth(year: number, month: number): Promise<string | null> {
    const monthStr = String(month).padStart(2, '0')
    const prefix = `${year}-${monthStr}-%`

    const rows = this.db
      .prepare<[string], SalesReportRow>(
        `
      SELECT so.code AS order_code, so.order_date,
             p.model AS product_model, p.name AS product_name,
             soi.quantity
      FROM sales_order_items soi
      INNER JOIN sales_orders so ON so.id = soi.sales_order_id
      INNER JOIN products p ON p.id = soi.product_id
      WHERE so.order_date LIKE ?
      ORDER BY so.order_date, so.code
    `
      )
      .all(prefix)

    const wb = new ExcelJS.Workbook()
    wb.creator = 'HomeInventory'
    wb.created = new Date()

    const ws = wb.addWorksheet(`Xuất hàng T${month}-${year}`)
    ws.columns = [
      { header: 'Mã phiếu', key: 'orderCode', width: 16 },
      { header: 'Ngày xuất', key: 'orderDate', width: 14 },
      { header: 'Mã sản phẩm', key: 'productModel', width: 18 },
      { header: 'Tên sản phẩm', key: 'productName', width: 30 },
      { header: 'Số lượng', key: 'quantity', width: 12 }
    ]

    let totalQty = 0
    for (const r of rows) {
      totalQty += r.quantity
      ws.addRow({
        orderCode: r.order_code,
        orderDate: r.order_date,
        productModel: r.product_model,
        productName: r.product_name,
        quantity: r.quantity
      })
    }

    const totalRow = ws.addRow({
      orderCode: '',
      orderDate: '',
      productModel: '',
      productName: 'TỔNG CỘNG',
      quantity: totalQty
    })
    styleTotalRow(totalRow)
    styleHeader(ws)
    styleDataRows(ws)
    ws.getColumn('quantity').alignment = { horizontal: 'right' }

    const result = await dialog.showSaveDialog(BrowserWindow.getAllWindows()[0]!, {
      title: `Xuất bán hàng tháng ${month}/${year}`,
      defaultPath: join(app.getPath('documents'), `xuat-hang-T${monthStr}-${year}.xlsx`),
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    await wb.xlsx.writeFile(result.filePath)
    return result.filePath
  }
}
