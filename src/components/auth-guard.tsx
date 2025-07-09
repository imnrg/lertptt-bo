import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
  requireRole?: string[]
  redirectTo?: string
}

export default async function AuthGuard({
  children,
  requireRole,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const session = await getServerSession(authOptions)

  // ถ้าไม่มี session ให้ redirect ไปหน้า login
  if (!session) {
    redirect(redirectTo)
  }

  // ถ้าระบุ role ที่จำเป็น ให้ตรวจสอบ role ของ user
  if (requireRole && session.user?.role) {
    const userRole = session.user.role
    if (!requireRole.includes(userRole)) {
      redirect('/dashboard')
    }
  }

  return <>{children}</>
}

// Hook สำหรับตรวจสอบ authentication ใน server components
export async function checkAuth(requireRole?: string[]) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      isAuthenticated: false,
      user: null,
      session: null,
    }
  }

  // ตรวจสอบ role ถ้าระบุ
  if (requireRole && session.user?.role) {
    const userRole = session.user.role
    if (!requireRole.includes(userRole)) {
      return {
        isAuthenticated: true,
        user: session.user,
        session,
        hasPermission: false,
      }
    }
  }

  return {
    isAuthenticated: true,
    user: session.user,
    session,
    hasPermission: true,
  }
}