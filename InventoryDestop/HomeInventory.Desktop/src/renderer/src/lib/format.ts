const vndFormatter = new Intl.NumberFormat('vi-VN')
const vndFormatterDecimal = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatCurrencyVnd(cents: number, showDecimal?: boolean): string {
  const amount = cents / 100
  const hasDecimal = showDecimal ?? (cents % 100 !== 0)
  return `${(hasDecimal ? vndFormatterDecimal : vndFormatter).format(amount)} ₫`
}

export function formatRawCurrencyVnd(value: number): string {
  return `${vndFormatter.format(Math.round(value))} ₫`
}

export function formatDateDdMmYyyy(value: string): string {
  if (!value) return '-'
  const datePart = value.includes('T') ? value.split('T')[0] : value
  const parts = datePart.split('-')
  if (parts.length !== 3) return value
  const [year, month, day] = parts
  if (!year || !month || !day) return value
  return `${day}-${month}-${year}`
}
