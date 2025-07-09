import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const createShiftSchema = z.object({
  name: z.string().min(1, 'ชื่อผลัดงานต้องไม่ว่าง'),
  userId: z.string().min(1, 'ต้องระบุรหัสผู้ใช้'),
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)).optional().nullable(),
  totalSales: z.number().min(0, 'ยอดขายต้องไม่ติดลบ').default(0),
  cashSales: z.number().min(0, 'ยอดขายเงินสดต้องไม่ติดลบ').default(0),
  creditSales: z.number().min(0, 'ยอดขายเครดิตต้องไม่ติดลบ').default(0),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
  fuelPrices: z
    .array(
      z.object({
        fuelTypeId: z.string(),
        price: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
      })
    )
    .optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.status = status
    }

    // Calculate summary data
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [shifts, total, activeShiftsCount, todayShifts] = await Promise.all([
      prisma.shift.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shift.count({ where }),
      // Count active shifts
      prisma.shift.count({
        where: { status: 'ACTIVE' }
      }),
      // Get today's shifts for total sales calculation
      prisma.shift.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          totalSales: true,
        },
      }),
    ])

    // Calculate total sales for today
    const totalSalesToday = todayShifts.reduce((sum, shift) => sum + shift.totalSales, 0)

    return NextResponse.json({
      shifts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      summary: {
        activeShifts: activeShiftsCount,
        totalSalesToday,
      },
    })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผลัดงาน' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createShiftSchema.parse(body)

    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่ระบุ' }, { status: 404 })
    }

    // ตรวจสอบว่าผู้ใช้มีผลัดงานที่กำลังทำงานอยู่หรือไม่
    if (validatedData.status === 'ACTIVE') {
      const activeShift = await prisma.shift.findFirst({
        where: {
          userId: validatedData.userId,
          status: 'ACTIVE',
        },
      })

      if (activeShift) {
        return NextResponse.json(
          { error: 'ผู้ใช้มีผลัดงานที่กำลังทำงานอยู่แล้ว' },
          { status: 400 }
        )
      }
    }

    // สร้างผลัดงานและราคาเชื้อเพลิง
    const shift = await prisma.$transaction(async (tx) => {
      // สร้างผลัดงาน
      const newShift = await tx.shift.create({
        data: {
          name: validatedData.name,
          userId: validatedData.userId,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          totalSales: validatedData.totalSales,
          cashSales: validatedData.cashSales,
          creditSales: validatedData.creditSales,
          notes: validatedData.notes,
          status: validatedData.status,
        },
      })

      // ถ้ามีการกำหนดราคาเชื้อเพลิง
      if (validatedData.fuelPrices && validatedData.fuelPrices.length > 0) {
        await tx.shiftFuelPrice.createMany({
          data: validatedData.fuelPrices.map((fp) => ({
            shiftId: newShift.id,
            fuelTypeId: fp.fuelTypeId,
            price: fp.price,
          })),
        })
      } else {
        // ใช้ราคาปัจจุบันจากระบบ
        const currentPrices = await tx.fuelPrice.findMany({
          where: {
            isActive: true,
            effectiveDate: { lte: new Date() },
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
        })

        if (currentPrices.length > 0) {
          await tx.shiftFuelPrice.createMany({
            data: currentPrices.map((price) => ({
              shiftId: newShift.id,
              fuelTypeId: price.fuelTypeId,
              price: price.price,
            })),
          })
        }
      }

      // ดึงข้อมูลผลัดงานพร้อมความสัมพันธ์
      return await tx.shift.findUnique({
        where: { id: newShift.id },
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
        },
      })
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างผลัดงาน' },
      { status: 500 }
    )
  }
}