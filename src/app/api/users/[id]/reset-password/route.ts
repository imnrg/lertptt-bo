import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resetUserPasswordSchema } from "@/lib/validations"
import bcrypt from "bcryptjs"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่าน" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { newPassword } = resetUserPasswordSchema.parse(body)

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

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      }
    })

    return NextResponse.json({ message: "รีเซ็ตรหัสผ่านสำเร็จ" })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" },
      { status: 500 }
    )
  }
}