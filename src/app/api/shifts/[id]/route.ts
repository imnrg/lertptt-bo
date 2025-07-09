import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateShiftSchema = z.object({
  name: z.string().min(1, 'ชื่อผลัดงานต้องไม่ว่าง').optional(),
  startTime: z.string().transform((str) => new Date(str)).optional(),
  endTime: z.string().transform((str) => new Date(str)).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  fuelPrices: z.array(z.object({
    fuelTypeId: z.string(),
    price: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  })).optional(),
})

// GET: ดึงข้อมูลรายละเอียดผลัดงาน
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const { id: shiftId } = await params

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
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
    })

    if (!shift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงาน' }, { status: 404 })
    }

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Error fetching shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผลัดงาน' },
      { status: 500 }
    )
  }
}

// PUT: แก้ไขผลัดงาน
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const { id: shiftId } = await params
    const body = await request.json()
    const validatedData = updateShiftSchema.parse(body)

    // ตรวจสอบว่าผลัดงานมีอยู่
    const existingShift = await prisma.shift.findUnique({
      where: { id: shiftId },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงาน' }, { status: 404 })
    }

    // ตรวจสอบสิทธิ์การแก้ไข
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER' && existingShift.userId !== session.user.id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขผลัดงานนี้' }, { status: 403 })
    }

    // อัปเดตผลัดงานและราคาเชื้อเพลิง
    const updatedShift = await prisma.$transaction(async (tx) => {
      // อัปเดตผลัดงาน
      await tx.shift.update({
        where: { id: shiftId },
        data: {
          name: validatedData.name,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          notes: validatedData.notes,
          status: validatedData.status,
        },
      })

      // อัปเดตราคาเชื้อเพลิง (ถ้ามี)
      if (validatedData.fuelPrices) {
        // ลบราคาเดิม
        await tx.shiftFuelPrice.deleteMany({
          where: { shiftId },
        })

        // เพิ่มราคาใหม่
        if (validatedData.fuelPrices.length > 0) {
          await tx.shiftFuelPrice.createMany({
            data: validatedData.fuelPrices.map(fp => ({
              shiftId,
              fuelTypeId: fp.fuelTypeId,
              price: fp.price,
            })),
          })
        }
      }

      // ดึงข้อมูลผลัดงานพร้อมความสัมพันธ์
      return await tx.shift.findUnique({
        where: { id: shiftId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
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
      })
    })

    return NextResponse.json(updatedShift)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตผลัดงาน' },
      { status: 500 }
    )
  }
}

// DELETE: ลบผลัดงาน
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const { id: shiftId } = await params

    // ตรวจสอบว่าผลัดงานมีอยู่และนับจำนวนข้อมูลที่เกี่ยวข้อง
    const [existingShift, meterCount, tankCount, salesCount] = await Promise.all([
      prisma.shift.findUnique({ where: { id: shiftId } }),
      prisma.meterReading.count({ where: { shiftId } }),
      prisma.tankReading.count({ where: { shiftId } }),
      prisma.sale.count({ where: { shiftId } })
    ])

    if (!existingShift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงาน' }, { status: 404 })
    }

    // ตรวจสอบสิทธิ์การลบ
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบผลัดงาน' }, { status: 403 })
    }

    // ไม่อนุญาตให้ลบผลัดงานที่กำลังใช้งาน
    if (existingShift.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'ไม่สามารถลบผลัดงานที่กำลังใช้งานได้' },
        { status: 400 }
      )
    }

    // ไม่อนุญาตให้ลบผลัดงานที่มีข้อมูลแล้ว
    if (meterCount > 0 || tankCount > 0 || salesCount > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบผลัดงานที่มีข้อมูลการทำงานแล้ว' },
        { status: 400 }
      )
    }

    // ลบผลัดงาน (จะลบข้อมูลที่เกี่ยวข้องด้วยเนื่องจาก onDelete: Cascade)
    await prisma.shift.delete({
      where: { id: shiftId },
    })

    return NextResponse.json({ message: 'ลบผลัดงานเรียบร้อยแล้ว' })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบผลัดงาน' },
      { status: 500 }
    )
  }
}