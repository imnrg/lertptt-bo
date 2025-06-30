import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการเปลี่ยนสถานะผู้ใช้" },
        { status: 403 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้" },
        { status: 404 }
      )
    }

    // Prevent toggling self
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: "ไม่สามารถเปลี่ยนสถานะบัญชีของตนเองได้" },
        { status: 400 }
      )
    }

    // Toggle user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: !existingUser.isActive,
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
    console.error("Error toggling user status:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้" },
      { status: 500 }
    )
  }
}