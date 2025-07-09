import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const { id: shiftId } = await params

    // ตรวจสอบว่าผลัดงานมีอยู่และเป็น ACTIVE
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    })

    if (!shift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงาน' }, { status: 404 })
    }

    if (shift.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'สามารถจบได้เฉพาะผลัดงานที่กำลังใช้งาน' },
        { status: 400 }
      )
    }

    // อัปเดตสถานะผลัดงานเป็น COMPLETED และกำหนดเวลาสิ้นสุด
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        shiftPrices: {
          include: {
            fuelType: true,
          },
        },
        _count: {
          select: {
            meterReadings: true,
            tankReadings: true,
            sales: true,
          },
        },
      },
    })

    return NextResponse.json(updatedShift)
  } catch (error) {
    console.error('Error ending shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการจบผลัดงาน' },
      { status: 500 }
    )
  }
}