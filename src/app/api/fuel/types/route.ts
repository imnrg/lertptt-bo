import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fuelTypeSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fuelTypes = await prisma.fuelType.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tanks: {
          select: {
            id: true,
            name: true,
            currentLevel: true,
            capacity: true,
          }
        },
        products: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            tanks: true,
            dispensers: true,
            products: true,
          }
        }
      }
    })

    return NextResponse.json(fuelTypes)
  } catch (error) {
    console.error('Error fetching fuel types:', error)
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
    const validatedData = fuelTypeSchema.parse(body)

    // Check if code already exists
    const existingFuelType = await prisma.fuelType.findFirst({
      where: {
        OR: [
          { code: validatedData.code },
          { name: validatedData.name }
        ]
      }
    })

    if (existingFuelType) {
      return NextResponse.json(
        { error: 'รหัสหรือชื่อประเภทเชื้อเพลิงนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    const fuelType = await prisma.fuelType.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            tanks: true,
            dispensers: true,
            products: true,
          }
        }
      }
    })

    return NextResponse.json(fuelType, { status: 201 })
  } catch (error) {
    console.error('Error creating fuel type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}