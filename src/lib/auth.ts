import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  username: z.string().min(1, "ชื่อผู้ใช้จำเป็นต้องระบุ").max(50, "ชื่อผู้ใช้ยาวเกินไป"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร").max(100, "รหัสผ่านยาวเกินไป"),
})

interface AuthError extends Error {
  code?: string
}

interface AuthUser {
  id: string
  username: string
  name: string
  email: string | null
  role: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "ชื่อผู้ใช้", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" }
      },
      async authorize(credentials): Promise<AuthUser | null> {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error("ข้อมูลการเข้าสู่ระบบไม่ครบถ้วน")
          }

          // Validate input format
          const validationResult = loginSchema.safeParse(credentials)
          if (!validationResult.success) {
            throw new Error("ข้อมูลที่ป้อนไม่ถูกต้อง")
          }

          const { username, password } = validationResult.data

          // Find user with case-insensitive username
          const user = await prisma.user.findFirst({
            where: { 
              username: {
                equals: username,
                mode: 'insensitive'
              }
            }
          })

          // Debug logging for troubleshooting
          console.log('Debug - Login attempt:', {
            username,
            userFound: !!user,
            hasPassword: !!(user?.password),
            isActive: user?.isActive,
            userId: user?.id
          })

          if (!user?.password) {
            // Use generic error message to prevent username enumeration
            throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
          }

          // Check if account is active
          if (!user.isActive) {
            const error = new Error("บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ") as AuthError
            error.code = "ACCOUNT_SUSPENDED"
            throw error
          }

          // Verify password with timing-safe comparison
          const isPasswordValid = await bcrypt.compare(password, user.password)

          if (!isPasswordValid) {
            // Generic error message to prevent timing attacks
            throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
          }

          // Return user data (excluding sensitive information)
          // Handle null name by providing fallback
          return {
            id: user.id,
            username: user.username,
            name: user.name ?? user.username, // Use username as fallback if name is null
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          
          // Re-throw with appropriate message
          if (error instanceof Error) {
            throw error
          }
          
          throw new Error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
        token.isActive = true
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Use nullish coalescing operator instead of logical OR
        session.user.id = token.sub ?? ""
        // Remove unnecessary type assertions
        session.user.role = token.role
        session.user.username = token.username
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Log successful login attempts
      console.log(`User ${user.username} signed in successfully`)
    },
    async signOut({ token }) {
      // Log logout events
      console.log(`User ${token.username} signed out`)
    },
  },
}