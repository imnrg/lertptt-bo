import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const endShiftSchema = z.object({
  totalSales: z.number().min(0, 'ยอดขายต้องไม่ติดลบ').optional(),
  notes: z.string().optional().nullable(),
})

export async function POST(
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
    const validatedData = endShiftSchema.parse(body)

    // ตรวจสอบว่าผลัดงานมีอยู่จริงและกำลังทำงาน
    const existingShift = await prisma.shift.findUnique({
      where: { id: params.id },
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

    if (!existingShift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงานที่ระบุ' }, { status: 404 })
    }

    if (existingShift.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'ผลัดงานนี้ไม่ได้อยู่ในสถานะทำงาน' },
        { status: 400 }
      )
    }

    // จบผลัดงาน
    const updatedShift = await prisma.shift.update({
      where: { id: params.id },
      data: {
        endTime: new Date(),
        status: 'COMPLETED',
        totalSales: validatedData.totalSales ?? existingShift.totalSales,
        notes: validatedData.notes ?? existingShift.notes,
      },
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

    console.error('Error ending shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการจบผลัดงาน' },
      { status: 500 }
    )
  }
}