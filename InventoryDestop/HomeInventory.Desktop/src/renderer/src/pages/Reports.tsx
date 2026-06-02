import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd } from '@renderer/lib/format'
import type { ImportSummaryDto } from '@shared/types/dtos'

const EMPTY_MONTHLY = () => Array.from({ length: 12 }, () => 0)

export function Reports() {
  const toast = useToast()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [rows, setRows] = useState<ImportSummaryDto[]>([])
  const [salesMonthly, setSalesMonthly] = useState<number[]>(EMPTY_MONTHLY)
  const [loading, setLoading] = useState(false)

  // Load available years on mount
  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await window.api.report.getAvailableYears()
        const normalized = years.toSorted((a, b) => b - a)
        const nextYear =
          normalized.length > 0 && !normalized.includes(Number(year)) ? String(normalized[0]) : year
        setAvailableYears(normalized)
        setYear(nextYear)
      } catch (error) {
        setAvailableYears([])
        reportAppError(toast, 'BC-YEAR-01', 'Không tải được danh sách năm báo cáo', error)
      }
    }
    void loadAvailableYears()
  }, [toast])

  const loadReport = useCallback(
    async (y: string) => {
      if (!y) return
      setLoading(true)
      try {
        const yNum = Number(y)
        const [importRows, salesRows] = await Promise.all([
          window.api.report.getImportSummary(yNum),
          window.api.report.getSalesOrderMonthly(yNum)
        ])
        setRows(importRows)
        setSalesMonthly(salesRows)
      } catch (error) {
        reportAppError(toast, 'BC-LOAD-01', 'Không tải được dữ liệu báo cáo', error)
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    if (availableYears.length === 0) {
      setRows([])
      setSalesMonthly(EMPTY_MONTHLY())
      return
    }
    void loadReport(year)
  }, [year, availableYears, loadReport])

  const byMonth = useMemo(() => {
    const map = new Map<number, ImportSummaryDto>()
    for (const row of rows) map.set(row.month, row)
    return map
  }, [rows])

  const handleExport = (fn: () => Promise<string | null>, errCode: string, errMsg: string) => {
    void fn()
      .then((f) => {
        if (f) toast.success('Đã xuất thành công')
      })
      .catch((e) => reportAppError(toast, errCode, errMsg, e))
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Báo cáo Nhập Xuất</h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem thống kê giá trị nhập xuất kho theo thời gian.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Xuất theo tháng cụ thể */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-md px-2 py-1 bg-gray-50">
            <span className="text-xs text-gray-500 mr-1">Tháng:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border-0 bg-transparent text-sm text-gray-700 focus:outline-none"
              aria-label="Chọn tháng xuất"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  T{m}
                </option>
              ))}
            </select>
            <Button
              icon={Download}
              variant="outline"
              size="sm"
              onClick={() =>
                handleExport(
                  () => window.api.export.exportPurchaseByMonth(Number(year), selectedMonth),
                  'BC-EXP-06',
                  'Không xuất được nhập theo tháng'
                )
              }
            >
              Nhập T{selectedMonth}
            </Button>
            <Button
              icon={Download}
              variant="outline"
              size="sm"
              onClick={() =>
                handleExport(
                  () => window.api.export.exportSalesByMonth(Number(year), selectedMonth),
                  'BC-EXP-07',
                  'Không xuất được bán theo tháng'
                )
              }
            >
              Bán T{selectedMonth}
            </Button>
          </div>
          <Button
            icon={Download}
            variant="outline"
            size="sm"
            onClick={() =>
              handleExport(
                () => window.api.export.exportInventoryReport(),
                'BC-EXP-03',
                'Không xuất được tồn kho'
              )
            }
          >
            Tồn kho
          </Button>
          <Button
            icon={Download}
            variant="outline"
            size="sm"
            onClick={() =>
              handleExport(
                () => window.api.export.exportPurchaseReport(Number(year)),
                'BC-EXP-04',
                'Không xuất được báo cáo nhập'
              )
            }
          >
            Nhập hàng ({year})
          </Button>
          <Button
            icon={Download}
            variant="outline"
            size="sm"
            onClick={() =>
              handleExport(
                () => window.api.export.exportSalesReport(Number(year)),
                'BC-EXP-05',
                'Không xuất được báo cáo xuất'
              )
            }
          >
            Bán hàng ({year})
          </Button>
        </div>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <label htmlFor="report-year" className="text-sm font-medium text-gray-700">
            Năm báo cáo:
          </label>
          <select
            id="report-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
            disabled={availableYears.length === 0}
          >
            {availableYears.length === 0 ? (
              <option value="">Chưa có dữ liệu</option>
            ) : (
              availableYears.map((itemYear) => (
                <option key={itemYear} value={String(itemYear)}>
                  {itemYear}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Detail table */}
      <div className="flex-1 grid grid-cols-1 gap-6 min-h-0">
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Bảng chi tiết năm {year}</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="pb-2 font-medium">Tháng</th>
                  <th className="pb-2 font-medium text-right">Giá trị Nhập (VNĐ)</th>
                  <th className="pb-2 font-medium text-right">Giá trị Xuất (VNĐ)</th>
                  <th className="pb-2 font-medium text-right">Số phiếu nhập</th>
                  <th className="pb-2 font-medium text-right">Số phiếu xuất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Đang tải dữ liệu báo cáo…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Chưa có dữ liệu báo cáo
                    </td>
                  </tr>
                )}
                {!loading &&
                  Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const importRow = byMonth.get(m)
                    const salesCount = salesMonthly[m - 1] ?? 0
                    const salesOrderCount =
                      importRow?.totalSalesOrders ?? (salesCount > 0 ? salesCount : 0)
                    return (
                      <tr key={m} className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium">Tháng {m}</td>
                        <td className="py-3 text-right text-gray-900 font-medium">
                          {importRow ? formatCurrencyVnd(importRow.totalAmount) : '-'}
                        </td>
                        <td className="py-3 text-right text-blue-700 font-medium">-</td>
                        <td className="py-3 text-right text-gray-600">
                          {importRow ? importRow.totalOrders : '-'}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {salesOrderCount > 0 ? salesOrderCount : '-'}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
