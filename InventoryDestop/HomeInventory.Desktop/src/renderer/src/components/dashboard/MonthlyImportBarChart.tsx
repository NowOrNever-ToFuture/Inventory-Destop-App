interface MonthlyImportBarChartProps {
  year: number
  availableYears: number[]
  importMonthly: number[]
  maxValue: number
  loadingSummary: boolean
  loadingChart: boolean
  onYearChange: (year: number) => void
}

export function MonthlyImportBarChart({
  year,
  availableYears,
  importMonthly,
  maxValue,
  loadingSummary,
  loadingChart,
  onYearChange
}: MonthlyImportBarChartProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 h-[22rem] flex flex-col min-w-0 overflow-hidden">
      <div className="flex justify-between items-center mb-6 gap-3">
        <h3 className="text-base font-semibold text-gray-900 truncate">
          Biểu đồ Nhập/Xuất Kho ({year})
        </h3>
        <select
          className="border border-gray-300 rounded-md text-sm px-3 py-1.5 bg-white text-gray-700 shrink-0"
          value={String(year)}
          onChange={(e) => onYearChange(Number(e.target.value))}
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

      <div className="flex-1 border-b border-l border-gray-200 flex items-end justify-between px-4 pb-0 relative min-w-0 overflow-x-auto overflow-y-hidden">
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
        <div className="min-w-[560px] w-full h-full flex items-end justify-between gap-2">
          {importMonthly.map((value, i) => {
            const h = (value / maxValue) * 100
            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[36px]">
                <div
                  className="w-full max-w-10 bg-blue-100 rounded-t-sm relative group cursor-pointer"
                  style={{ height: `${h}%` }}
                >
                  <div
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${h * 0.7}%` }}
                  ></div>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 pb-2">T{i + 1}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
