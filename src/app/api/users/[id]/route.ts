import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateUserSchema } from "@/lib/validations"

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการเข้าถึง" },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการแก้ไขผู้ใช้" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, name, email, role, isActive } = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้" },
        { status: 404 }
      )
    }

    // Check if username already exists (excluding current user)
    if (username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username }
      })

      if (usernameExists) {
        return NextResponse.json(
          { error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" },
          { status: 400 }
        )
      }
    }

    // Check if email already exists (excluding current user)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "อีเมลนี้มีอยู่แล้ว" },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username,
        name,
        email: email || null,
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

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขผู้ใช้" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการลบผู้ใช้" },
        { status: 403 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้" },
        { status: 404 }
      )
    }

    // Prevent deleting self
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีของตนเองได้" },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: "ลบผู้ใช้สำเร็จ" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบผู้ใช้" },
      { status: 500 }
    )
  }
}