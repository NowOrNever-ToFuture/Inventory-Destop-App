import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtext: string
  trend: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export function StatCard({ title, value, subtext, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {trend !== 'neutral' && (
          <span
            className={`p-1.5 rounded-md ${
              trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-gray-900 mb-1">{value}</div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {trendValue && trend !== 'neutral' && (
          <span className={`font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '+' : '-'}
            {trendValue}
          </span>
        )}
        <span>{subtext}</span>
      </div>
    </div>
  )
}
