/**
 * Money utilities for integer-based currency storage.
 *
 * Convention: All monetary values are stored in the database as integers
 * representing "cents" (value * 100). This avoids floating-point precision
 * issues with JavaScript numbers.
 *
 * Example: 100.50 VNĐ → stored as 10050 in DB
 */

/** Multiplier for converting display amount to storage integer */
export const MONEY_SCALE = 100

/**
 * Convert a display amount (e.g. 100.50) to storage integer (e.g. 10050).
 * Rounds to nearest integer to avoid floating-point drift.
 */
export function toMoneyInt(displayAmount: number): number {
  return Math.round(displayAmount * MONEY_SCALE)
}

/**
 * Convert a storage integer (e.g. 10050) back to display amount (e.g. 100.50).
 */
export function fromMoneyInt(storedInt: number): number {
  return storedInt / MONEY_SCALE
}

/**
 * Validate that a money value (in display form) is within acceptable range.
 */
export function isValidMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}
