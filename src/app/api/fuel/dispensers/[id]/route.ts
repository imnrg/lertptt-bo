import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dispenserSchema } from '@/lib/validations'

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

    const dispenser = await prisma.dispenser.findUnique({
      where: { id },
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

    if (!dispenser) {
      return NextResponse.json({ error: 'ไม่พบหัวจ่าย' }, { status: 404 })
    }

    return NextResponse.json(dispenser)
  } catch (error) {
    console.error('Error fetching dispenser:', error)
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
    const validatedData = dispenserSchema.parse(body)

    // Check if code already exists for other dispensers
    const existingDispenser = await prisma.dispenser.findFirst({
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

    // Auto-assign fuel type from tank (override any provided fuelTypeId)
    const dispenserData = {
      ...validatedData,
      fuelTypeId: tank.fuelTypeId
    }

    const dispenser = await prisma.dispenser.update({
      where: { id },
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

    return NextResponse.json(dispenser)
  } catch (error) {
    console.error('Error updating dispenser:', error)
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

    const dispenser = await prisma.dispenser.findUnique({
      where: { id }
    })

    if (!dispenser) {
      return NextResponse.json({ error: 'ไม่พบหัวจ่าย' }, { status: 404 })
    }

    await prisma.dispenser.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'ลบหัวจ่ายสำเร็จ' })
  } catch (error) {
    console.error('Error deleting dispenser:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}