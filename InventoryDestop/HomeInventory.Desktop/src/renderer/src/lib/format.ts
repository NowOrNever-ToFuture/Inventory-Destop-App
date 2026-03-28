export function formatCurrencyVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))} VNĐ`
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
