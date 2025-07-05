import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBangkokTime } from '@/lib/utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: priceId } = await params

    // ตรวจสอบว่าราคานี้มีอยู่จริงหรือไม่
    const existingPrice = await prisma.fuelPrice.findUnique({
      where: { id: priceId },
      include: {
        fuelType: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    if (!existingPrice) {
      return NextResponse.json(
        { error: 'ไม่พบราคาเชื้อเพลิงที่ระบุ' },
        { status: 404 }
      )
    }

    // ตรวจสอบว่าเป็นราคาปัจจุบันหรือไม่
    const now = getBangkokTime()
    const effectiveDate = new Date(existingPrice.effectiveDate)

    if (effectiveDate > now) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบราคาในอนาคตได้ ระบบรองรับเฉพาะการแก้ไขราคาปัจจุบัน' },
        { status: 400 }
      )
    }

    if (effectiveDate < now) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบราคาในอดีตได้' },
        { status: 400 }
      )
    }

    // ลบราคาปัจจุบัน (ราคาที่มีผลในวันนี้)
    await prisma.fuelPrice.update({
      where: { id: priceId },
      data: {
        isActive: false,
        updatedAt: now
      }
    })

    return NextResponse.json({ 
      message: `ลบราคา ${existingPrice.fuelType.name} สำเร็จ`,
      deletedPrice: {
        id: existingPrice.id,
        fuelTypeName: existingPrice.fuelType.name,
        price: existingPrice.price,
        effectiveDate: existingPrice.effectiveDate
      }
    })

  } catch (error) {
    console.error('Error deleting current price:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบราคา' },
      { status: 500 }
    )
  }
}