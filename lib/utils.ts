import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '';
  const num = Number(amount);
  const isWhole = num % 1 === 0;
  const formatted = isWhole
    ? Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₦${formatted}`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Deterministic UTC-based date formatting (e.g., "Oct 15")
 * Ensures identical string on server and client across all timezones and locales
 */
export function formatUtcDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const month = MONTH_NAMES[d.getUTCMonth()];
    const day = d.getUTCDate();
    return `${month} ${day}`;
  } catch {
    return '';
  }
}

/**
 * Deterministic UTC-based date formatting with year (e.g., "Oct 15, 2026")
 */
export function formatUtcDateWithYear(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const month = MONTH_NAMES[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return '';
  }
}
