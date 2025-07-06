import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const shiftUpdateSchema = z.object({
  name: z.string().min(1, 'ชื่อกะทำงานต้องไม่ว่าง').optional(),
  startTime: z.string().datetime('รูปแบบวันที่ไม่ถูกต้อง').optional(),
  endTime: z.string().datetime('รูปแบบวันที่ไม่ถูกต้อง').optional().nullable(),
  userId: z.string().min(1, 'ต้องเลือกพนักงาน').optional(),
  notes: z.string().optional().nullable(),
  totalSales: z.number().min(0, 'ยอดขายต้องไม่ติดลบ').optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const shift = await prisma.shift.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงานที่ระบุ' }, { status: 404 })
    }

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Error fetching shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผลัดงาน' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = shiftUpdateSchema.parse(body)

    // ตรวจสอบว่าผลัดงานมีอยู่จริง
    const existingShift = await prisma.shift.findUnique({
      where: { id: params.id },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงานที่ระบุ' }, { status: 404 })
    }

    // ถ้าเปลี่ยนพนักงาน ตรวจสอบว่าพนักงานใหม่มีกะที่ยังไม่จบหรือไม่
    if (validatedData.userId && validatedData.userId !== existingShift.userId) {
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId: validatedData.userId,
          status: 'ACTIVE',
          id: { not: params.id },
        },
      })

      if (activeShift) {
        return NextResponse.json(
          { error: 'พนักงานคนนี้มีกะทำงานที่ยังไม่เสร็จสิ้น' },
          { status: 400 }
        )
      }
    }

    // ถ้าเปลี่ยนสถานะเป็น COMPLETED และยังไม่มี endTime ให้ใส่เวลาปัจจุบัน
    if (validatedData.status === 'COMPLETED' && !existingShift.endTime && !validatedData.endTime) {
      validatedData.endTime = new Date().toISOString()
    }

    const updatedShift = await prisma.shift.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(updatedShift)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตผลัดงาน' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    // ตรวจสอบสิทธิ์ - เฉพาะ ADMIN และ MANAGER เท่านั้น
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบผลัดงาน' }, { status: 403 })
    }

    const existingShift = await prisma.shift.findUnique({
      where: { id: params.id },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงานที่ระบุ' }, { status: 404 })
    }

    // ไม่อนุญาตให้ลบผลัดงานที่กำลังทำงาน
    if (existingShift.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'ไม่สามารถลบผลัดงานที่กำลังทำงานได้' },
        { status: 400 }
      )
    }

    await prisma.shift.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'ลบผลัดงานเรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบผลัดงาน' },
      { status: 500 }
    )
  }
}