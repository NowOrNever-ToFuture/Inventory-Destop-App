/**
 * Money utilities for integer-based currency storage.
 *
 * Convention: All monetary values are stored in the database as integers
 * (plain VND value, no multiplication).
 *
 * Example: 1000 VND → stored as 1000 in DB
 */

/** Multiplier for converting display amount to storage integer */
export const MONEY_SCALE = 1

/**
 * Convert a display amount to storage integer (identity - no scaling).
 */
export function toMoneyInt(displayAmount: number): number {
  return Math.round(displayAmount)
}

/**
 * Convert a storage integer back to display amount (identity - no scaling).
 */
export function fromMoneyInt(storedInt: number): number {
  return storedInt
}

/**
 * Validate that a money value is within acceptable range.
 */
export function isValidMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}
