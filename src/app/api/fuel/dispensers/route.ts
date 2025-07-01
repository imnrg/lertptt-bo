import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dispenserSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dispensers = await prisma.dispenser.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tank: {
          select: {
            id: true,
            name: true,
            code: true,
            currentLevel: true,
            capacity: true,
          }
        },
        fuelType: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    })

    return NextResponse.json(dispensers)
  } catch (error) {
    console.error('Error fetching dispensers:', error)
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
    const validatedData = dispenserSchema.parse(body)

    // Check if code already exists
    const existingDispenser = await prisma.dispenser.findFirst({
      where: {
        OR: [
          { code: validatedData.code },
          { name: validatedData.name }
        ]
      }
    })

    if (existingDispenser) {
      return NextResponse.json(
        { error: 'รหัสหรือชื่อหัวจ่ายนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // Validate tank exists and get its fuel type
    const tank = await prisma.tank.findUnique({
      where: { id: validatedData.tankId },
      include: {
        fuelType: true
      }
    })

    if (!tank) {
      return NextResponse.json(
        { error: 'ไม่พบถังที่ระบุ' },
        { status: 400 }
      )
    }

    // Auto-assign fuel type from tank
    const dispenserData = {
      ...validatedData,
      fuelTypeId: tank.fuelTypeId
    }

    const dispenser = await prisma.dispenser.create({
      data: dispenserData,
      include: {
        tank: {
          select: {
            id: true,
            name: true,
            code: true,
            currentLevel: true,
            capacity: true,
          }
        },
        fuelType: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    })

    return NextResponse.json(dispenser, { status: 201 })
  } catch (error) {
    console.error('Error creating dispenser:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}