export const UI_MAX_NUMBER = 100_000_000_000_000
export const UI_MAX_WORDS = 100

export function clampNumberString(value: string, max = UI_MAX_NUMBER): string {
  if (value.trim() === '') return value
  const num = Number(value)
  if (!Number.isFinite(num)) return value
  if (num > max) return String(max)
  return value
}

export function limitWords(value: string, maxWords = UI_MAX_WORDS): string {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return value
  return `${words.slice(0, maxWords).join(' ')} ...`
}
