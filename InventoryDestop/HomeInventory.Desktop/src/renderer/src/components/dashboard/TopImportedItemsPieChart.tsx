import { useMemo } from 'react'
import type { TopImportedItemDto, TopImportedItemsReportScope } from '@shared/types/dtos/report.dto'

const viVnFormatter = new Intl.NumberFormat('vi-VN')

interface TopImportedItemsPieChartProps {
  year: number
  availableYears: number[]
  scope: TopImportedItemsReportScope
  month: number
  items: TopImportedItemDto[]
  loading: boolean
  onScopeChange: (scope: TopImportedItemsReportScope) => void
  onMonthChange: (month: number) => void
}

const PIE_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#06b6d4',
  '#14b8a6',
  '#22c55e',
  '#84cc16',
  '#f59e0b',
  '#f97316'
]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  }
}

function createArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

export function TopImportedItemsPieChart({
  year,
  availableYears,
  scope,
  month,
  items,
  loading,
  onScopeChange,
  onMonthChange
}: TopImportedItemsPieChartProps) {
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0),
    [items]
  )

  const slices = useMemo(() => {
    if (totalQuantity <= 0) return []

    let currentAngle = 0
    return items.map((item, index) => {
      const value = Math.max(0, item.quantity)
      const angle = (value / totalQuantity) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      return {
        ...item,
        color: PIE_COLORS[index % PIE_COLORS.length],
        percent: totalQuantity > 0 ? (value / totalQuantity) * 100 : 0,
        startAngle,
        endAngle
      }
    })
  }, [items, totalQuantity])

  const hasData = items.length > 0 && totalQuantity > 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 h-[24rem] flex flex-col min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 truncate">Mặt hàng nhập nhiều nhất</h3>
        <div className="flex items-center gap-2 shrink-0">
          <select
            className="border border-gray-300 rounded-md text-sm px-2 py-1.5 bg-white text-gray-700"
            value={scope}
            onChange={(e) => onScopeChange(e.target.value as TopImportedItemsReportScope)}
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
          ? `Top mặt hàng nhập nhiều nhất tháng ${month}/${year}`
          : `Top mặt hàng nhập nhiều nhất năm ${year}`}
      </div>

      <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 z-20 bg-white/70">
            Đang tải biểu đồ...
          </div>
        )}

        {availableYears.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
            Chưa có dữ liệu nhập kho để hiển thị báo cáo.
          </div>
        ) : !hasData && !loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
            Không có dữ liệu cho bộ lọc hiện tại.
          </div>
        ) : (
          <div className="h-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-3 min-w-0 overflow-hidden">
            <div className="min-w-0 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 260 260" className="w-full h-full max-h-72">
                {slices.length === 1 ? (
                  <circle cx="130" cy="130" r="104" fill={slices[0].color} />
                ) : (
                  slices.map((slice, idx) => (
                    <path
                      key={`${slice.label}-${idx}`}
                      d={createArcPath(130, 130, 104, slice.startAngle, slice.endAngle)}
                      fill={slice.color}
                    />
                  ))
                )}
              </svg>
            </div>

            <div className="min-w-0 overflow-auto pr-1">
              <ul className="space-y-2">
                {slices.map((slice, idx) => (
                  <li
                    key={`${slice.label}-legend-${idx}`}
                    className="flex items-start gap-2 min-w-0"
                  >
                    <span
                      className="size-3 rounded-sm mt-1 shrink-0"
                      style={{ backgroundColor: slice.color }}
                    ></span>
                    <div className="min-w-0 text-sm text-gray-700">
                      <div className="truncate" title={slice.label}>
                        {slice.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {viVnFormatter.format(slice.quantity)} (
                        {slice.percent.toFixed(1)}%)
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
