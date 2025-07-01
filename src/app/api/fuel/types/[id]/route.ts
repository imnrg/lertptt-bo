import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fuelTypeSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const fuelType = await prisma.fuelType.findUnique({
      where: { id },
      include: {
        tanks: {
          select: {
            id: true,
            name: true,
            code: true,
            currentLevel: true,
            capacity: true,
            location: true,
            isActive: true,
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          }
        },
        dispensers: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true,
            isActive: true,
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

    if (!fuelType) {
      return NextResponse.json({ error: 'ไม่พบประเภทเชื้อเพลิง' }, { status: 404 })
    }

    return NextResponse.json(fuelType)
  } catch (error) {
    console.error('Error fetching fuel type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = fuelTypeSchema.parse(body)

    // Check if code already exists for other fuel types
    const existingFuelType = await prisma.fuelType.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { code: validatedData.code },
              { name: validatedData.name }
            ]
          }
        ]
      }
    })

    if (existingFuelType) {
      return NextResponse.json(
        { error: 'รหัสหรือชื่อประเภทเชื้อเพลิงนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    const fuelType = await prisma.fuelType.update({
      where: { id },
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

    return NextResponse.json(fuelType)
  } catch (error) {
    console.error('Error updating fuel type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if fuel type is being used
    const fuelType = await prisma.fuelType.findUnique({
      where: { id },
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

    if (!fuelType) {
      return NextResponse.json({ error: 'ไม่พบประเภทเชื้อเพลิง' }, { status: 404 })
    }

    if (fuelType._count.tanks > 0 || fuelType._count.dispensers > 0 || fuelType._count.products > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบประเภทเชื้อเพลิงที่มีการใช้งานอยู่ได้' },
        { status: 400 }
      )
    }

    await prisma.fuelType.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'ลบประเภทเชื้อเพลิงสำเร็จ' })
  } catch (error) {
    console.error('Error deleting fuel type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}