import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations'

// Constants for security
const BCRYPT_ROUNDS = 12

// Rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5

function getRateLimitKey(ip: string): string {
  return `register:${ip}`
}

function isRateLimited(ip: string): boolean {
  const key = getRateLimitKey(ip)
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  record.count++
  return false
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'

    // Check rate limiting
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' },
        { status: 429 }
      )
    }

    // Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'ข้อมูล JSON ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Validate input schema
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message)
      return NextResponse.json(
        { error: errorMessages[0] || 'ข้อมูลที่ป้อนไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    const { username, name, email, password } = validationResult.data

    // Sanitize input data
    const sanitizedData = {
      username: username.trim().toLowerCase(),
      name: name.trim(),
      email: email?.trim().toLowerCase() || null,
      password: password
    }

    // Check for potential SQL injection patterns (extra security layer)
    const suspiciousPatterns = [
      /(['";]|--|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b)/i,
      /<script|javascript:/i,
      /\b(eval|exec|system)\b/i
    ]

    const inputString = JSON.stringify(sanitizedData)
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(inputString)) {
        return NextResponse.json(
          { error: 'ข้อมูลที่ป้อนมีรูปแบบที่ไม่อนุญาต' },
          { status: 400 }
        )
      }
    }

    // Use database transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check if username already exists (case-insensitive)
      const existingUser = await tx.user.findFirst({
        where: { 
          username: {
            equals: sanitizedData.username,
            mode: 'insensitive'
          }
        }
      })

      if (existingUser) {
        throw new Error('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว')
      }

      // Check if email already exists (if provided)
      if (sanitizedData.email) {
        const existingEmail = await tx.user.findFirst({
          where: { 
            email: {
              equals: sanitizedData.email,
              mode: 'insensitive'
            }
          }
        })

        if (existingEmail) {
          throw new Error('อีเมลนี้มีอยู่ในระบบแล้ว')
        }
      }

      // Hash password with secure rounds
      const hashedPassword = await bcrypt.hash(sanitizedData.password, BCRYPT_ROUNDS)

      // Create user
      const user = await tx.user.create({
        data: {
          username: sanitizedData.username,
          name: sanitizedData.name,
          email: sanitizedData.email,
          password: hashedPassword,
          role: 'USER', // Default role
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        }
      })

      return user
    })

    // Log successful registration (without sensitive data)
    console.log(`New user registered: ${result.username} (${result.id})`)

    return NextResponse.json({
      message: 'สมัครสมาชิกสำเร็จ สามารถเข้าสู่ระบบได้ทันที',
      user: {
        id: result.id,
        username: result.username,
        name: result.name,
        email: result.email,
        role: result.role,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว') || 
          error.message.includes('อีเมลนี้มีอยู่ในระบบแล้ว')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

// Prevent other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}