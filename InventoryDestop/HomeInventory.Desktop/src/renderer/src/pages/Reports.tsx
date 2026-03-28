import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { useToast } from '@renderer/components/shared/ToastProvider'
import { reportAppError } from '@renderer/lib/app-error'
import { formatCurrencyVnd } from '@renderer/lib/format'
import type { ImportSummaryDto } from '@shared/types/dtos'

export function Reports() {
  const toast = useToast()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [rows, setRows] = useState<ImportSummaryDto[]>([])
  const [salesMonthly, setSalesMonthly] = useState<number[]>(Array.from({ length: 12 }, () => 0))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await window.api.report.getAvailableYears()
        const normalized = [...years].sort((a, b) => b - a)
        setAvailableYears(normalized)
        if (normalized.length > 0 && !normalized.includes(Number(year))) {
          setYear(String(normalized[0]))
        }
      } catch (error) {
        setAvailableYears([])
        reportAppError(toast, 'BC-YEAR-01', 'Không tải được danh sách năm báo cáo', error)
      }
    }

    void loadAvailableYears()
  }, [toast])

  useEffect(() => {
    if (availableYears.length === 0) {
      setRows([])
      setSalesMonthly(Array.from({ length: 12 }, () => 0))
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const y = Number(year)
        const [importRows, salesRows] = await Promise.all([
          window.api.report.getImportSummary(y),
          window.api.report.getSalesOrderMonthly(y)
        ])
        setRows(importRows)
        setSalesMonthly(salesRows)
      } catch (error) {
        reportAppError(toast, 'BC-LOAD-01', 'Không tải được dữ liệu báo cáo', error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [year, availableYears])

  const byMonth = useMemo(() => {
    const map = new Map<number, ImportSummaryDto>()
    for (const row of rows) map.set(row.month, row)
    return map
  }, [rows])

  const handleExportCsv = () => {
    try {
      const header = ['Tháng', 'Giá trị nhập (VNĐ)', 'Số phiếu nhập', 'Số phiếu xuất']
      const lines = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1
        const importRow = byMonth.get(month)
        const salesCount = salesMonthly[i] ?? 0
        return [
          `Tháng ${month}`,
          String(Math.round(importRow?.totalAmount ?? 0)),
          String(importRow?.totalOrders ?? 0),
          String(salesCount)
        ].join(',')
      })

      const csv = [header.join(','), ...lines].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bao-cao-nhap-xuat-${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Xuất file báo cáo thành công')
    } catch (error) {
      reportAppError(toast, 'BC-EXP-01', 'Không xuất được file báo cáo', error)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Báo cáo Nhập Xuất</h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem thống kê giá trị nhập xuất kho theo thời gian.
          </p>
        </div>
        <Button icon={Download} variant="outline" onClick={handleExportCsv}>
          Xuất Excel
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Năm báo cáo:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-blue-500"
            disabled={availableYears.length === 0}
          >
            {availableYears.length === 0 ? (
              <option value="">Chưa có dữ liệu nhập kho</option>
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

      <div className="flex-1 grid grid-cols-1 gap-6 min-h-0">
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Bảng chi tiết</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="pb-2 font-medium">Tháng</th>
                  <th className="pb-2 font-medium text-right">Giá trị Nhập (VNĐ)</th>
                  <th className="pb-2 font-medium text-right">Số phiếu nhập</th>
                  <th className="pb-2 font-medium text-right">Số phiếu xuất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      Đang tải dữ liệu báo cáo...
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      Chưa có dữ liệu báo cáo
                    </td>
                  </tr>
                )}
                {!loading &&
                  Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const importRow = byMonth.get(m)
                    const salesCount = salesMonthly[m - 1] ?? 0

                    return (
                      <tr key={m} className="hover:bg-gray-50/50">
                        <td className="py-3 font-medium">Tháng {m}</td>
                        <td className="py-3 text-right text-gray-900 font-medium">
                          {importRow ? formatCurrencyVnd(importRow.totalAmount) : '-'}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {importRow ? importRow.totalOrders : '-'}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {salesCount > 0 ? salesCount : '-'}
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
