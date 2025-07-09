import crypto from 'crypto'
import { z } from 'zod'

// Security constants
export const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 12,
  JWT_EXPIRY: '24h',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_ATTEMPTS: 5,
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
} as const

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/['"`;]/g, '') // Remove potential SQL injection characters
    .slice(0, 1000) // Limit length
}

// SQL injection pattern detection
export function hasSqlInjectionPattern(input: string): boolean {
  const patterns = [
    /(['";]|--|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
    /\b(exec|execute|sp_|xp_)\b/i,
    /(\*|%|_|\[|\])/,
  ]
  
  return patterns.some(pattern => pattern.test(input))
}

// XSS pattern detection
export function hasXssPattern(input: string): boolean {
  const patterns = [
    /<script|javascript:|on\w+\s*=/i,
    /data:text\/html|vbscript:|livescript:/i,
    /expression\s*\(|@import|@charset/i,
  ]
  
  return patterns.some(pattern => pattern.test(input))
}

// Validate and sanitize object data
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false, error: string } {
  try {
    // First validate with schema
    const validated = schema.parse(obj)
    
    // Then sanitize string values
    const sanitized = Object.entries(validated).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        // Check for malicious patterns
        if (hasSqlInjectionPattern(value) || hasXssPattern(value)) {
          throw new Error(`Invalid characters detected in field: ${key}`)
        }
        (acc as Record<string, unknown>)[key] = sanitizeInput(value)
      } else {
        (acc as Record<string, unknown>)[key] = value
      }
      return acc
    }, {} as T)
    
    return { success: true, data: sanitized }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Hash sensitive data with salt
export function hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex')
  return { hash, salt: actualSalt }
}

// Verify hashed data
export function verifyHash(data: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'))
}

// Rate limiting utilities
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()

  constructor(
    private maxAttempts: number = SECURITY_CONFIG.RATE_LIMIT_MAX_ATTEMPTS,
    private windowMs: number = SECURITY_CONFIG.RATE_LIMIT_WINDOW
  ) {}

  isLimited(key: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(key)

    if (!record) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs })
      return false
    }

    if (now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs })
      return false
    }

    if (record.count >= this.maxAttempts) {
      return true
    }

    record.count++
    return false
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }

  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key)
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts
    }
    return Math.max(0, this.maxAttempts - record.count)
  }
}

// Content Security Policy generator
export function generateCSP(options: {
  allowInlineStyles?: boolean
  allowInlineScripts?: boolean
  allowEval?: boolean
  additionalScriptSources?: string[]
  additionalStyleSources?: string[]
} = {}): string {
  const {
    allowInlineStyles = false,
    allowInlineScripts = false,
    allowEval = false,
    additionalScriptSources = [],
    additionalStyleSources = []
  } = options

  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      ...(allowInlineScripts ? ["'unsafe-inline'"] : []),
      ...(allowEval ? ["'unsafe-eval'"] : []),
      ...additionalScriptSources
    ],
    'style-src': [
      "'self'",
      ...(allowInlineStyles ? ["'unsafe-inline'"] : []),
      ...additionalStyleSources
    ],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  }

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

// IP address utilities
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-client-ip') ||
    'unknown'
  )
}

// Request validation
export function validateRequestMethod(
  method: string,
  allowedMethods: string[]
): boolean {
  return allowedMethods.includes(method.toUpperCase())
}

export function validateContentType(
  contentType: string | null,
  expectedType: string = 'application/json'
): boolean {
  return contentType?.includes(expectedType) ?? false
}

// Error response helpers
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      code,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      }
    }
  )
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      }
    }
  )
}

// Audit logging
export interface AuditLog {
  userId?: string
  action: string
  resource: string
  ip: string
  userAgent?: string
  timestamp: Date
  success: boolean
  details?: Record<string, unknown>
}

export function createAuditLog(
  action: string,
  resource: string,
  ip: string,
  options: Partial<AuditLog> = {}
): AuditLog {
  return {
    action,
    resource,
    ip,
    timestamp: new Date(),
    success: true,
    ...options
  }
}

// Environment validation
export function validateEnvironment(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate database URL format
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.warn('DATABASE_URL should use postgresql:// or postgres:// protocol')
  }

  // Validate NextAuth secret length
  const secret = process.env.NEXTAUTH_SECRET
  if (secret && secret.length < 32) {
    console.warn('NEXTAUTH_SECRET should be at least 32 characters long')
  }
}