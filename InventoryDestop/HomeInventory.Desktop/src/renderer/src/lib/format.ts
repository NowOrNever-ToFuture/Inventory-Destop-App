export function formatCurrencyVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))} VNĐ`
}
