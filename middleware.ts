import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth pages
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Require authentication for dashboard and protected routes
        if (pathname.startsWith('/dashboard') || 
            pathname.startsWith('/fuel') || 
            pathname.startsWith('/products') ||
            pathname.startsWith('/shifts') ||
            pathname.startsWith('/debtors') ||
            pathname.startsWith('/settings')) {
          return !!token
        }
        
        // Allow access to public routes
        return true
      },
    },
    pages: {
      signIn: '/auth/login',
    }
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}