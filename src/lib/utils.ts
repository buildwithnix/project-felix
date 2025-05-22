import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseURL(): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin;
  }

  // Server-side
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Fallback
  return 'https://projectfelix.vercel.app';
}

export function size(
  value: string | unknown[] | Record<string, unknown> | null | undefined
): number {
  if (value == null) return 0;
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length;
  }
  return 0;
}
