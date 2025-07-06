import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toZonedTime, format } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalDateStr(date: Date = new Date(), timezone: string = 'America/Los_Angeles'): string {
  const zoned: Date = toZonedTime(date, timezone);
  return format(zoned, 'yyyy-MM-dd', { timeZone: timezone });
}
