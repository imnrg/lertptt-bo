import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tankSchema } from '@/lib/validations'

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

    const tank = await prisma.tank.findUnique({
      where: { id },
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
            location: true,
            isActive: true,
          }
        }
      }
    })

    if (!tank) {
      return NextResponse.json({ error: 'ไม่พบถัง' }, { status: 404 })
    }

    return NextResponse.json(tank)
  } catch (error) {
    console.error('Error fetching tank:', error)
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
    const validatedData = tankSchema.parse(body)

    // Check if code already exists for other tanks
    const existingTank = await prisma.tank.findFirst({
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

    const tank = await prisma.tank.update({
      where: { id },
      data: validatedData,
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
        }
      }
    })

    return NextResponse.json(tank)
  } catch (error) {
    console.error('Error updating tank:', error)
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

    // Check if tank has dispensers
    const tank = await prisma.tank.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            dispensers: true,
          }
        }
      }
    })

    if (!tank) {
      return NextResponse.json({ error: 'ไม่พบถัง' }, { status: 404 })
    }

    if (tank._count.dispensers > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบถังที่มีหัวจ่ายเชื่อมต่ออยู่ได้' },
        { status: 400 }
      )
    }

    await prisma.tank.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'ลบถังสำเร็จ' })
  } catch (error) {
    console.error('Error deleting tank:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}