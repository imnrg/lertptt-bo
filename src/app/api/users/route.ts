import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserSchema } from "@/lib/validations"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log('=== Users API GET called ===') // Debug log
    
    const session = await getServerSession(authOptions)
    console.log('Session in API:', session) // Debug session
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      console.log('Access denied - insufficient permissions') // Debug access
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการเข้าถึง" },
        { status: 403 }
      )
    }

    console.log('Fetching users from database...') // Debug DB query
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            shifts: true,
            accounts: true,
            sessions: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    console.log('Users found:', users.length) // Debug result count
    console.log('Users data:', users) // Debug actual data

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการสร้างผู้ใช้ใหม่" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, name, email, password, role, isActive } = createUserSchema.parse(body)

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" },
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: "อีเมลนี้มีอยู่แล้ว" },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        name,
        email: email || null,
        password: hashedPassword,
        role,
        isActive,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างผู้ใช้" },
      { status: 500 }
    )
  }
}