import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timezone and Date utilities
export const BANGKOK_TIMEZONE = 'Asia/Bangkok'

/**
 * Get current Bangkok time
 */
export function getBangkokTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BANGKOK_TIMEZONE }))
}

/**
 * Convert any date to Bangkok timezone
 */
export function toBangkokTime(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date
  return new Date(inputDate.toLocaleString("en-US", { timeZone: BANGKOK_TIMEZONE }))
}

/**
 * Format date to Thai format (e.g., "15 มี.ค. 2568")
 */
export function formatThaiDate(date: Date | string, options?: {
  showTime?: boolean
  showYear?: boolean
  shortMonth?: boolean
}): string {
  const {
    showTime = false,
    showYear = true,
    shortMonth = true
  } = options || {}

  const bangkokDate = toBangkokTime(date)
  
  const thaiMonths = shortMonth 
    ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    : ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
       'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  
  const day = bangkokDate.getDate()
  const month = thaiMonths[bangkokDate.getMonth()]
  const year = bangkokDate.getFullYear() + 543 // Convert to Buddhist Era
  
  let formatted = `${day} ${month}`
  
  if (showYear) {
    formatted += ` ${year}`
  }
  
  if (showTime) {
    const hours = bangkokDate.getHours().toString().padStart(2, '0')
    const minutes = bangkokDate.getMinutes().toString().padStart(2, '0')
    formatted += ` ${hours}:${minutes} น.`
  }
  
  return formatted
}

/**
 * Format date to Thai long format (e.g., "วันอังคารที่ 15 มีนาคม พ.ศ. 2568")
 */
export function formatThaiDateLong(date: Date | string): string {
  const bangkokDate = toBangkokTime(date)
  
  const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์']
  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                     'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  
  const dayName = thaiDays[bangkokDate.getDay()]
  const day = bangkokDate.getDate()
  const month = thaiMonths[bangkokDate.getMonth()]
  const year = bangkokDate.getFullYear() + 543
  
  return `${dayName}ที่ ${day} ${month} พ.ศ. ${year}`
}

/**
 * Get current date in YYYY-MM-DD format for input fields (Bangkok timezone)
 */
export function getCurrentDateForInput(): string {
  const bangkokDate = getBangkokTime()
  return bangkokDate.toISOString().split('T')[0]
}

/**
 * Get current datetime in YYYY-MM-DDTHH:mm format for datetime-local input (Bangkok timezone)
 */
export function getCurrentDateTimeForInput(): string {
  const bangkokDate = getBangkokTime()
  const year = bangkokDate.getFullYear()
  const month = (bangkokDate.getMonth() + 1).toString().padStart(2, '0')
  const day = bangkokDate.getDate().toString().padStart(2, '0')
  const hours = bangkokDate.getHours().toString().padStart(2, '0')
  const minutes = bangkokDate.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convert input date (YYYY-MM-DD) to Bangkok timezone Date object
 */
export function inputDateToBangkokDate(inputDate: string): Date {
  // Create date at midnight Bangkok time
  const [year, month, day] = inputDate.split('-').map(Number)
  const bangkokDate = new Date()
  bangkokDate.setFullYear(year, month - 1, day)
  bangkokDate.setHours(0, 0, 0, 0)
  
  // Convert to Bangkok timezone
  return toBangkokTime(bangkokDate)
}

/**
 * Check if date is today (Bangkok timezone)
 */
export function isToday(date: Date | string): boolean {
  const bangkokDate = toBangkokTime(date)
  const today = getBangkokTime()
  
  return bangkokDate.toDateString() === today.toDateString()
}

/**
 * Check if date is in the past (Bangkok timezone)
 */
export function isPast(date: Date | string): boolean {
  const bangkokDate = toBangkokTime(date)
  const now = getBangkokTime()
  
  return bangkokDate < now
}

/**
 * Check if date is in the future (Bangkok timezone)
 */
export function isFuture(date: Date | string): boolean {
  const bangkokDate = toBangkokTime(date)
  const now = getBangkokTime()
  
  return bangkokDate > now
}

/**
 * Format relative time in Thai (e.g., "2 ชั่วโมงที่แล้ว", "ในอีก 3 วัน")
 */
export function formatThaiRelativeTime(date: Date | string): string {
  const bangkokDate = toBangkokTime(date)
  const now = getBangkokTime()
  const diffInMs = bangkokDate.getTime() - now.getTime()
  const diffInMinutes = Math.floor(Math.abs(diffInMs) / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  
  const isPast = diffInMs < 0
  
  if (diffInMinutes < 1) {
    return 'เมื่อสักครู่'
  } else if (diffInMinutes < 60) {
    return isPast ? `${diffInMinutes} นาทีที่แล้ว` : `ในอีก ${diffInMinutes} นาที`
  } else if (diffInHours < 24) {
    return isPast ? `${diffInHours} ชั่วโมงที่แล้ว` : `ในอีก ${diffInHours} ชั่วโมง`
  } else if (diffInDays < 7) {
    return isPast ? `${diffInDays} วันที่แล้ว` : `ในอีก ${diffInDays} วัน`
  } else {
    return formatThaiDate(bangkokDate)
  }
}

// Numeric validation utilities
/**
 * Validate if string is a valid number
 */
export function isValidNumber(value: string): boolean {
  if (value === '') return false
  const num = Number(value)
  return !isNaN(num) && isFinite(num)
}

/**
 * Validate if string is a valid positive number
 */
export function isValidPositiveNumber(value: string): boolean {
  if (!isValidNumber(value)) return false
  return Number(value) >= 0
}

/**
 * Validate if string is a valid decimal number with specific decimal places
 */
export function isValidDecimal(value: string, decimalPlaces: number = 2): boolean {
  if (!isValidNumber(value)) return false
  const parts = value.split('.')
  if (parts.length > 2) return false
  if (parts.length === 2 && parts[1].length > decimalPlaces) return false
  return true
}

/**
 * Format numeric input to ensure valid decimal format
 */
export function formatNumericInput(value: string, options?: {
  allowNegative?: boolean
  decimalPlaces?: number
  maxValue?: number
  minValue?: number
}): string {
  const {
    allowNegative = false,
    decimalPlaces = 2,
    maxValue,
    minValue
  } = options || {}

  // Remove any non-numeric characters except decimal point and minus sign
  let cleaned = value.replace(/[^\d.-]/g, '')
  
  // Handle negative sign
  if (!allowNegative) {
    cleaned = cleaned.replace(/-/g, '')
  } else {
    // Only allow one minus sign at the beginning
    const minusCount = (cleaned.match(/-/g) || []).length
    if (minusCount > 1) {
      cleaned = cleaned.replace(/-/g, '')
      if (value.startsWith('-')) {
        cleaned = '-' + cleaned
      }
    } else if (cleaned.includes('-') && !cleaned.startsWith('-')) {
      cleaned = cleaned.replace(/-/g, '')
    }
  }
  
  // Handle decimal point - only allow one
  const decimalCount = (cleaned.match(/\./g) || []).length
  if (decimalCount > 1) {
    const parts = cleaned.split('.')
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  
  // Limit decimal places
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts[1] && parts[1].length > decimalPlaces) {
      cleaned = parts[0] + '.' + parts[1].substring(0, decimalPlaces)
    }
  }
  
  // Apply min/max constraints
  if (cleaned && isValidNumber(cleaned)) {
    const num = Number(cleaned)
    if (maxValue !== undefined && num > maxValue) {
      cleaned = maxValue.toString()
    }
    if (minValue !== undefined && num < minValue) {
      cleaned = minValue.toString()
    }
  }
  
  return cleaned
}

/**
 * Handle numeric input change event
 */
export function handleNumericInputChange(
  value: string,
  onChange: (value: string) => void,
  options?: {
    allowNegative?: boolean
    decimalPlaces?: number
    maxValue?: number
    minValue?: number
  }
): void {
  const formatted = formatNumericInput(value, options)
  onChange(formatted)
}

/**
 * Convert string to number safely
 */
export function safeNumberConversion(value: string): number {
  if (!value || !isValidNumber(value)) return 0
  return Number(value)
}