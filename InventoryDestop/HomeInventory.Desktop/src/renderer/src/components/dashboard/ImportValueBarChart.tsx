const viVnFormatter = new Intl.NumberFormat('vi-VN')

interface ImportValueBarChartProps {
  year: number
  values: number[]
}

export function ImportValueBarChart({ year, values }: ImportValueBarChartProps) {
  const safeValues = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0))
  const maxVal = Math.max(...safeValues, 1)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 h-72 flex flex-col min-w-0 overflow-hidden">
      <h3 className="font-semibold text-gray-900 mb-4">Biểu đồ Giá trị Nhập Kho ({year})</h3>

      <div className="flex-1 border-b border-l border-gray-200 flex items-end justify-between pl-10 pr-2 pb-0 relative overflow-x-auto">
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] sm:text-xs text-gray-400 py-4 text-right px-1 bg-white/80">
          <span>{viVnFormatter.format(Math.round(maxVal))}</span>
          <span>{viVnFormatter.format(Math.round(maxVal / 2))}</span>
          <span>0</span>
        </div>

        <div className="min-w-[420px] w-full h-full flex items-end justify-between gap-1 sm:gap-2">
          {safeValues.map((amount, i) => {
            const h = amount > 0 ? Math.max((amount / maxVal) * 100, 4) : 0
            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 min-w-[24px]">
                <div className="w-full max-w-8 sm:max-w-10 h-full bg-blue-100/50 rounded-t-sm relative group cursor-pointer overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full bg-blue-600 rounded-t-sm transition-all"
                    style={{ height: `${h}%` }}
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
