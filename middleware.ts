import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Security constants
const SECURE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100

function getRateLimitKey(ip: string, pathname: string): string {
  return `${ip}:${pathname}`
}

function isRateLimited(ip: string, pathname: string): boolean {
  const key = getRateLimitKey(ip, pathname)
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

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/fuel',
  '/products',
  '/debtors',
  '/users',
  '/settings',
  '/api/'
]

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
  '/public/'
]

// Protected routes that require specific roles
const ADMIN_ROUTES = ['/users', '/settings/system']
const MANAGER_ROUTES = ['/fuel', '/products']
const USER_ROUTES = ['/dashboard', '/settings/profile']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

function hasRequiredRole(userRole: string, pathname: string): boolean {
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return userRole === 'ADMIN'
  }
  
  if (MANAGER_ROUTES.some(route => pathname.startsWith(route))) {
    return ['ADMIN', 'MANAGER'].includes(userRole)
  }
  
  if (USER_ROUTES.some(route => pathname.startsWith(route))) {
    return ['ADMIN', 'MANAGER', 'USER'].includes(userRole)
  }
  
  return true
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ??
      req.headers.get('x-real-ip') ??
      req.headers.get('cf-connecting-ip') ??
      'unknown'

    // Apply rate limiting
    if (isRateLimited(clientIp, pathname)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            ...SECURE_HEADERS,
          }
        }
      )
    }

    // Check if user is authenticated for protected routes
    if (isProtectedRoute(pathname) && !token) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user is trying to access auth pages while logged in
    if (token && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Create response with security headers
    const response = NextResponse.next()
    
    // Add security headers
    Object.entries(SECURE_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CSP header for better XSS protection
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', cspHeader)

    // Additional security for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
    }

    // Check role-based access control
    if (token?.role && !hasRequiredRole(token.role, pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes
        if (isPublicRoute(pathname)) {
          return true
        }
        
        // Require authentication for protected routes
        if (isProtectedRoute(pathname)) {
          return !!token
        }
        
        // Allow access to other routes
        return true
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error',
    }
  }
)

export const config = {
  matcher: [
    // Match all routes except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}