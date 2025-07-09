'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseAuthGuardOptions {
  redirectTo?: string
  requireRole?: string[]
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { redirectTo = '/auth/login', requireRole } = options

  useEffect(() => {
    // If session is loading, wait
    if (status === 'loading') return

    // If not authenticated, redirect to login
    if (status === 'unauthenticated') {
      const currentPath = window.location.pathname
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    // If authenticated but role is required, check role
    if (status === 'authenticated' && requireRole && session?.user?.role) {
      const userRole = session.user.role
      if (!requireRole.includes(userRole)) {
        router.push('/dashboard')
        return
      }
    }
  }, [session, status, router, redirectTo, requireRole])

  return {
    session,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user: session?.user,
  }
}