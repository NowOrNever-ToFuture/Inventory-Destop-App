import { useEffect, useMemo, useState } from 'react'
import { StatCard } from '@renderer/components/ui/stat-card'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd } from '@renderer/lib/format'

export function Dashboard() {
  const toast = useToast()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [inventorySummary, setInventorySummary] = useState({ totalProducts: 0, totalStockValue: 0 })
  const [salesSummary, setSalesSummary] = useState({ totalOrders: 0, totalRevenue: 0 })
  const [importMonthly, setImportMonthly] = useState<number[]>(Array.from({ length: 12 }, () => 0))
  const [salesMonthly, setSalesMonthly] = useState<number[]>(Array.from({ length: 12 }, () => 0))
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingChart, setLoadingChart] = useState(false)

  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await window.api.report.getAvailableYears()
        if (years.length > 0) {
          const normalized = [...years].sort((a, b) => b - a)
          setAvailableYears(normalized)
          if (!normalized.includes(year)) {
            setYear(normalized[0])
          }
          return
        }

        setAvailableYears([])
      } catch (error) {
        setAvailableYears([])
        reportAppError(toast, 'DB-YEAR-01', 'Không tải được danh sách năm báo cáo', error)
      }
    }

    void loadAvailableYears()
  }, [currentYear, toast])

  useEffect(() => {
    const loadSummary = async () => {
      setLoadingSummary(true)
      try {
        const [inventory, sales] = await Promise.all([
          window.api.report.getInventorySummary(),
          window.api.report.getSalesSummary()
        ])
        setInventorySummary(inventory)
        setSalesSummary(sales)
      } catch (error) {
        reportAppError(toast, 'DB-LOAD-01', 'Không tải được dữ liệu tổng quan', error)
      } finally {
        setLoadingSummary(false)
      }
    }

    void loadSummary()
  }, [])

  useEffect(() => {
    if (availableYears.length === 0) return
    const loadMonthly = async () => {
      setLoadingChart(true)
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
      } finally {
        setLoadingChart(false)
      }
    }

    void loadMonthly()
  }, [year, availableYears])

  const currentMonth = new Date().getMonth()
  const totalImportCurrentMonth = importMonthly[currentMonth] ?? 0
  const totalSalesOrdersCurrentMonth = salesMonthly[currentMonth] ?? 0
  const maxValue = useMemo(() => Math.max(...importMonthly, 1), [importMonthly])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Tổng quan tình hình kho và giao dịch hôm nay.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Tổng Sản Phẩm"
          value={new Intl.NumberFormat('vi-VN').format(inventorySummary.totalProducts)}
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
          value={new Intl.NumberFormat('vi-VN').format(totalSalesOrdersCurrentMonth)}
          subtext={`tổng phiếu xuất toàn hệ thống: ${new Intl.NumberFormat('vi-VN').format(salesSummary.totalOrders)}`}
          trend="neutral"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 h-80 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-semibold text-gray-900">Biểu đồ Nhập/Xuất Kho ({year})</h3>
          <select
            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 bg-white text-gray-700"
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {availableYears.length === 0 ? (
              <option value="">Chưa có dữ liệu nhập kho</option>
            ) : (
              availableYears.map((itemYear) => (
                <option key={itemYear} value={String(itemYear)}>
                  Năm {itemYear}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex-1 border-b border-l border-gray-200 flex items-end justify-between px-4 pb-0 relative">
          {loadingSummary && <div className="absolute inset-0 bg-white/60 z-10 animate-pulse" />}
          {loadingChart && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 z-20 bg-white/70">
              Đang tải biểu đồ...
            </div>
          )}
          <div className="absolute left-[-40px] top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 py-4 text-right px-1">
            <span>{new Intl.NumberFormat('vi-VN').format(Math.round(maxValue))}</span>
            <span>{new Intl.NumberFormat('vi-VN').format(Math.round(maxValue / 2))}</span>
            <span>0</span>
          </div>
          {availableYears.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 z-20 bg-white/80">
              Chưa có dữ liệu nhập kho để hiển thị báo cáo năm.
            </div>
          )}
          {importMonthly.map((value, i) => {
            const h = (value / maxValue) * 100
            return (
              <div key={i} className="flex flex-col items-center gap-2 w-full">
                <div
                  className="w-12 bg-blue-100 rounded-t-sm relative group cursor-pointer"
                  style={{ height: `${h}%` }}
                >
                  <div
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${h * 0.7}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 pb-2">T{i + 1}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
