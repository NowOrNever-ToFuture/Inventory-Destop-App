import { useEffect, useState } from 'react'
import { StatCard } from '@renderer/components/ui/stat-card'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd } from '@renderer/lib/format'
import { TopImportedItemsPieChart } from '@renderer/components/dashboard/TopImportedItemsPieChart'
import { TopSupplierBarChart } from '@renderer/components/dashboard/TopSupplierBarChart'
import type { TopSupplierData } from '@renderer/components/dashboard/TopSupplierBarChart'
import type { TopImportedItemDto, TopImportedItemsReportScope } from '@shared/types/dtos/report.dto'

// Hoist formatter to avoid rebuilding on every render
const viVnFormatter = new Intl.NumberFormat('vi-VN')

const EMPTY_MONTHLY = () => Array.from({ length: 12 }, () => 0)

export function Dashboard() {
  const toast = useToast()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const [year, setYear] = useState(currentYear)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [inventorySummary, setInventorySummary] = useState({ totalProducts: 0, totalStockValue: 0 })
  const [salesSummary, setSalesSummary] = useState({ totalOrders: 0, totalRevenue: 0 })
  const [importMonthly, setImportMonthly] = useState<number[]>(EMPTY_MONTHLY)
  const [salesMonthly, setSalesMonthly] = useState<number[]>(EMPTY_MONTHLY)
  const [topImportedItems, setTopImportedItems] = useState<TopImportedItemDto[]>([])
  const [loadingTopImportedItems, setLoadingTopImportedItems] = useState(false)
  const [topImportedScope, setTopImportedScope] = useState<TopImportedItemsReportScope>('year')
  const [topImportedMonth, setTopImportedMonth] = useState(() => new Date().getMonth() + 1)
  const [topSuppliers, setTopSuppliers] = useState<TopSupplierData[]>([])
  const [loadingTopSuppliers, setLoadingTopSuppliers] = useState(false)
  const [topSupplierScope, setTopSupplierScope] = useState<'year' | 'month'>('year')
  const [topSupplierMonth, setTopSupplierMonth] = useState(() => new Date().getMonth() + 1)

  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await window.api.report.getAvailableYears()
        if (years.length > 0) {
          const normalized = years.toSorted((a, b) => b - a)
          const nextYear = normalized.includes(year) ? year : normalized[0]
          setAvailableYears(normalized)
          setYear(nextYear)
          return
        }
        setAvailableYears([])
      } catch (error) {
        setAvailableYears([])
        reportAppError(toast, 'DB-YEAR-01', 'Không tải được danh sách năm báo cáo', error)
      }
    }
    void loadAvailableYears()
  }, [toast])

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [inventory, sales] = await Promise.all([
          window.api.report.getInventorySummary(),
          window.api.report.getSalesSummary()
        ])
        setInventorySummary(inventory)
        setSalesSummary(sales)
      } catch (error) {
        reportAppError(toast, 'DB-LOAD-01', 'Không tải được dữ liệu tổng quan', error)
      }
    }
    void loadSummary()
  }, [toast])

  useEffect(() => {
    if (availableYears.length === 0) return
    const loadMonthly = async () => {
      try {
        const [importRows, salesRows] = await Promise.all([
          window.api.report.getImportSummary(year),
          window.api.report.getSalesOrderMonthly(year)
        ])
        const importSeries = Array.from({ length: 12 }, () => 0)
        for (const row of importRows) {
          if (row.month >= 1 && row.month <= 12) {
            importSeries[row.month - 1] = row.totalAmount
          }
        }
        setImportMonthly(importSeries)
        setSalesMonthly(salesRows)
      } catch (error) {
        reportAppError(toast, 'DB-LOAD-02', 'Không tải được dữ liệu biểu đồ', error)
      }
    }
    void loadMonthly()
  }, [year, availableYears, toast])

  useEffect(() => {
    if (availableYears.length === 0) {
      setTopImportedItems([])
      return
    }
    const loadTopImportedItems = async () => {
      setLoadingTopImportedItems(true)
      try {
        const rows = await window.api.report.getTopImportedItems({
          scope: topImportedScope,
          year,
          month: topImportedScope === 'month' ? topImportedMonth : undefined
        })
        setTopImportedItems(rows)
      } catch (error) {
        reportAppError(
          toast,
          'DB-LOAD-03',
          'Không tải được dữ liệu mặt hàng nhập nhiều nhất',
          error
        )
        setTopImportedItems([])
      } finally {
        setLoadingTopImportedItems(false)
      }
    }
    void loadTopImportedItems()
  }, [availableYears, topImportedMonth, topImportedScope, year, toast])

  useEffect(() => {
    if (availableYears.length === 0) {
      setTopSuppliers([])
      return
    }
    const loadTopSuppliers = async () => {
      setLoadingTopSuppliers(true)
      try {
        const rows = await window.api.report.getTopSuppliers({
          scope: topSupplierScope,
          year,
          month: topSupplierScope === 'month' ? topSupplierMonth : undefined
        })
        setTopSuppliers(rows)
      } catch (error) {
        reportAppError(toast, 'DB-LOAD-04', 'Không tải được dữ liệu đại lý nhập nhiều nhất', error)
        setTopSuppliers([])
      } finally {
        setLoadingTopSuppliers(false)
      }
    }
    void loadTopSuppliers()
  }, [availableYears, topSupplierMonth, topSupplierScope, year, toast])

  const totalImportCurrentMonth = importMonthly[currentMonth] ?? 0
  const totalSalesOrdersCurrentMonth = salesMonthly[currentMonth] ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Tổng quan tình hình kho và giao dịch hôm nay.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Tổng Sản Phẩm"
          value={viVnFormatter.format(inventorySummary.totalProducts)}
          subtext="tổng sản phẩm hiện có"
          trend="neutral"
        />
        <StatCard
          title="Giá Trị Tồn Kho"
          value={formatCurrencyVnd(inventorySummary.totalStockValue)}
          subtext="giá trị tồn kho theo giá nhập"
          trend="neutral"
        />
        <StatCard
          title="Tiền Nhập (Tháng)"
          value={formatCurrencyVnd(totalImportCurrentMonth)}
          subtext="tổng giá trị nhập tháng hiện tại"
          trend="neutral"
        />
        <StatCard
          title="Phiếu Xuất (Tháng)"
          value={viVnFormatter.format(totalSalesOrdersCurrentMonth)}
          subtext={`tổng phiếu xuất toàn hệ thống: ${viVnFormatter.format(salesSummary.totalOrders)}`}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopImportedItemsPieChart
          year={year}
          availableYears={availableYears}
          scope={topImportedScope}
          month={topImportedMonth}
          items={topImportedItems}
          loading={loadingTopImportedItems}
          onScopeChange={setTopImportedScope}
          onMonthChange={setTopImportedMonth}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <TopSupplierBarChart
          year={year}
          availableYears={availableYears}
          scope={topSupplierScope}
          month={topSupplierMonth}
          data={topSuppliers}
          loading={loadingTopSuppliers}
          onScopeChange={setTopSupplierScope}
          onMonthChange={setTopSupplierMonth}
        />
      </div>
    </div>
  )
}
