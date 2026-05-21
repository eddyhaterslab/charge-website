import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: 'EUR' = 'EUR'): string {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency }).format(amount);
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('nl-BE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatPeriod(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleDateString('nl-BE', {
    year: 'numeric',
    month: 'long',
  });
}
