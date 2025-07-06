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
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).default('ACTIVE'),
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

    const [shifts, total] = await Promise.all([
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
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shift.count({ where }),
    ])

    return NextResponse.json({
      shifts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

    const shift = await prisma.shift.create({
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