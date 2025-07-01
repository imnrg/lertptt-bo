import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tankSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tanks = await prisma.tank.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        fuelType: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        dispensers: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          }
        },
        _count: {
          select: {
            dispensers: true,
          }
        }
      }
    })

    return NextResponse.json(tanks)
  } catch (error) {
    console.error('Error fetching tanks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = tankSchema.parse(body)

    // Check if code already exists
    const existingTank = await prisma.tank.findFirst({
      where: {
        OR: [
          { code: validatedData.code },
          { name: validatedData.name }
        ]
      }
    })

    if (existingTank) {
      return NextResponse.json(
        { error: 'รหัสหรือชื่อถังนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // Validate fuel type exists
    const fuelType = await prisma.fuelType.findUnique({
      where: { id: validatedData.fuelTypeId }
    })

    if (!fuelType) {
      return NextResponse.json(
        { error: 'ไม่พบประเภทเชื้อเพลิงที่ระบุ' },
        { status: 400 }
      )
    }

    // Validate level constraints
    if (validatedData.maxLevel && validatedData.currentLevel > validatedData.maxLevel) {
      return NextResponse.json(
        { error: 'ระดับปัจจุบันต้องไม่เกินระดับสูงสุด' },
        { status: 400 }
      )
    }

    if (validatedData.currentLevel < validatedData.minLevel) {
      return NextResponse.json(
        { error: 'ระดับปัจจุบันต้องไม่น้อยกว่าระดับขั้นต่ำ' },
        { status: 400 }
      )
    }

    const tank = await prisma.tank.create({
      data: validatedData,
      include: {
        fuelType: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        _count: {
          select: {
            dispensers: true,
          }
        }
      }
    })

    return NextResponse.json(tank, { status: 201 })
  } catch (error) {
    console.error('Error creating tank:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}