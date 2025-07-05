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

    // ตรวจสอบว่าเป็นราคาในอนาคตหรือไม่
    const now = getBangkokTime()
    const effectiveDate = new Date(existingPrice.effectiveDate)

    if (effectiveDate <= now) {
      return NextResponse.json(
        { error: 'ไม่สามารถยกเลิกราคาที่มีผลแล้วหรือราคาปัจจุบัน' },
        { status: 400 }
      )
    }

    // ใช้ transaction เพื่อจัดการทั้งการลบราคาในอนาคตและปรับปรุงราคาปัจจุบัน
    const result = await prisma.$transaction(async (tx) => {
      // ลบราคาในอนาคต
      await tx.fuelPrice.update({
        where: { id: priceId },
        data: {
          isActive: false,
          updatedAt: now
        }
      })

      // หาราคาปัจจุบันของประเภทเชื้อเพลิงเดียวกัน
      const currentPrice = await tx.fuelPrice.findFirst({
        where: {
          fuelTypeId: existingPrice.fuelTypeId,
          isActive: true,
          effectiveDate: { lte: now },
          endDate: { equals: effectiveDate } // ราคาที่มีวันสิ้นสุดเท่ากับวันที่มีผลของราคาที่ยกเลิก
        },
        orderBy: { effectiveDate: 'desc' }
      })

      // ถ้าพบราคาปัจจุบันที่มีวันสิ้นสุดตรงกับวันที่มีผลของราคาที่ยกเลิก
      // ให้ปรับปรุงวันสิ้นสุดให้เป็น null (ไม่มีกำหนด)
      if (currentPrice) {
        await tx.fuelPrice.update({
          where: { id: currentPrice.id },
          data: {
            endDate: null,
            updatedAt: now
          }
        })
        
        return {
          canceled: existingPrice,
          updated: currentPrice
        }
      }

      return {
        canceled: existingPrice,
        updated: null
      }
    })

    return NextResponse.json({ 
      message: `ยกเลิกราคา ${existingPrice.fuelType.name} สำเร็จ`,
      canceledPrice: {
        id: existingPrice.id,
        fuelTypeName: existingPrice.fuelType.name,
        price: existingPrice.price,
        effectiveDate: existingPrice.effectiveDate
      },
      updatedCurrentPrice: result.updated ? {
        id: result.updated.id,
        endDate: null,
        message: 'ปรับปรุงวันสิ้นสุดของราคาปัจจุบันเป็นไม่มีกำหนดแล้ว'
      } : null
    })

  } catch (error) {
    console.error('Error canceling future price:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการยกเลิกราคา' },
      { status: 500 }
    )
  }
}