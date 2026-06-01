import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { formatCurrencyVnd } from '@renderer/lib/format'

export interface TopSupplierData {
  supplierName: string
  totalAmount: number
}

interface TopSupplierBarChartProps {
  year: number
  availableYears: number[]
  scope: 'year' | 'month'
  month: number
  data: TopSupplierData[]
  loading: boolean
  onScopeChange: (scope: 'year' | 'month') => void
  onMonthChange: (month: number) => void
}

const BAR_COLORS = ['#2563eb', '#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#f59e0b', '#f97316']

export function TopSupplierBarChart({
  year,
  availableYears,
  scope,
  month,
  data,
  loading,
  onScopeChange,
  onMonthChange
}: TopSupplierBarChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item, i) => ({
        name: item.supplierName.length > 15 ? item.supplierName.slice(0, 15) + '\u2026' : item.supplierName,
        fullName: item.supplierName,
        amount: item.totalAmount,
        fill: BAR_COLORS[i % BAR_COLORS.length]
      })),
    [data]
  )

  const hasData = chartData.length > 0 && chartData.some((d) => d.amount > 0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 h-[24rem] flex flex-col min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 truncate">
          Đại lý nhập hàng nhiều nhất
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <select
            className="border border-gray-300 rounded-md text-sm px-2 py-1.5 bg-white text-gray-700"
            value={scope}
            onChange={(e) => onScopeChange(e.target.value as 'year' | 'month')}
            disabled={availableYears.length === 0}
          >
            <option value="year">Theo năm</option>
            <option value="month">Theo tháng</option>
          </select>
          {scope === 'month' && (
            <select
              className="border border-gray-300 rounded-md text-sm px-2 py-1.5 bg-white text-gray-700 w-24"
              value={String(month)}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              disabled={availableYears.length === 0}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  Tháng {m}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3 truncate">
        {scope === 'month'
          ? `Top đại lý nhập nhiều nhất tháng ${month}/${year}`
          : `Top đại lý nhập nhiều nhất năm ${year}`}
      </div>

      <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 z-20 bg-white/70">
            Đang tải biểu đồ...
          </div>
        )}

        {availableYears.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
            Chưa có dữ liệu nhập kho.
          </div>
        ) : !hasData && !loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
            Không có dữ liệu cho bộ lọc hiện tại.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
                tickFormatter={(v) => formatCurrencyVnd(v * 100)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
                width={120}
              />
              <Tooltip
                formatter={(value) => [formatCurrencyVnd(Number(value) * 100), 'Tổng tiền nhập']}
                labelFormatter={(label) => `Đại lý: ${label}`}
                contentStyle={{ fontSize: 13 }}
              />
              <Bar dataKey="amount" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
