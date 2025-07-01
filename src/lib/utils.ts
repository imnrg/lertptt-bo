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