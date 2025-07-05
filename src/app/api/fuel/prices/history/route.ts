import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBangkokTime } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ดึงประวัติราคาที่ไม่ใช่ราคาปัจจุบัน (ที่มี endDate หรือ isActive = false)
    // จำกัดผลลัพธ์เพียง 10 รายการล่าสุด
    const now = getBangkokTime()
    const historicalPrices = await prisma.fuelPrice.findMany({
      where: {
        OR: [
          {
            // ราคาที่มี endDate (ไม่ว่าจะหมดอายุแล้วหรือยัง)
            endDate: { not: null }
          },
          {
            // ราคาที่ถูกยกเลิก (isActive = false)
            isActive: false
          }
        ]
      },
      include: {
        fuelType: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }, // เรียงตาม createdAt ล่าสุดก่อน
        { fuelTypeId: 'asc' }
      ],
      take: 10 // จำกัดผลลัพธ์เพียง 10 รายการ
    })

    // Convert dates to Bangkok timezone for response
    const pricesWithBangkokTime = historicalPrices.map(price => ({
      ...price,
      effectiveDate: price.effectiveDate.toISOString(),
      endDate: price.endDate?.toISOString() || null,
      createdAt: price.createdAt.toISOString(),
      updatedAt: price.updatedAt.toISOString(),
    }))

    return NextResponse.json(pricesWithBangkokTime)
  } catch (error) {
    console.error('Error fetching historical fuel prices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}