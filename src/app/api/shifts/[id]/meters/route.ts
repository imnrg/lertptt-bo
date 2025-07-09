import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const meterReadingSchema = z.object({
  dispenserId: z.string().min(1, 'ต้องระบุรหัสหัวจ่าย'),
  startReading: z.number().min(0, 'ค่าเริ่มต้นต้องไม่ติดลบ'),
  endReading: z.number().min(0, 'ค่าสิ้นสุดต้องไม่ติดลบ').optional().nullable(),
  testLiters: z.number().min(0, 'ลิตรทดสอบต้องไม่ติดลบ').default(0),
  usageLiters: z.number().min(0, 'ลิตรเบิกใช้ต้องไม่ติดลบ').default(0),
  discount: z.number().min(0, 'ส่วนลดต้องไม่ติดลบ').default(0),
})

// GET: ดึงข้อมูลการอ่านมิเตอร์ของผลัดงาน
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

    // ตรวจสอบว่าผลัดงานมีอยู่
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: true,
        shiftPrices: {
          include: {
            fuelType: true,
          },
        },
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงาน' }, { status: 404 })
    }

    // ดึงข้อมูลการอ่านมิเตอร์
    const meterReadings = await prisma.meterReading.findMany({
      where: { shiftId },
      include: {
        dispenser: {
          include: {
            fuelType: true,
            tank: true,
          },
        },
      },
      orderBy: { dispenser: { name: 'asc' } },
    })

    // ดึงข้อมูลหัวจ่ายทั้งหมดที่ใช้งานได้
    const dispensers = await prisma.dispenser.findMany({
      where: { isActive: true },
      include: {
        fuelType: true,
        tank: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      shift,
      meterReadings,
      dispensers,
    })
  } catch (error) {
    console.error('Error fetching meter readings:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการอ่านมิเตอร์' },
      { status: 500 }
    )
  }
}

// POST: เพิ่มหรืออัปเดตการอ่านมิเตอร์
export async function POST(
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
    const validatedData = meterReadingSchema.parse(body)

    // ตรวจสอบว่าผลัดงานมีอยู่และยังใช้งานได้
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    })

    if (!shift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงาน' }, { status: 404 })
    }

    if (shift.status === 'COMPLETED' || shift.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'ไม่สามารถแก้ไขผลัดงานที่เสร็จสิ้นหรือยกเลิกแล้ว' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่าหัวจ่ายมีอยู่
    const dispenser = await prisma.dispenser.findUnique({
      where: { id: validatedData.dispenserId },
      include: {
        fuelType: true,
      },
    })

    if (!dispenser) {
      return NextResponse.json({ error: 'ไม่พบหัวจ่ายที่ระบุ' }, { status: 404 })
    }

    // คำนวณปริมาณและจำนวนเงิน
    const totalLiters = validatedData.endReading 
      ? validatedData.endReading - validatedData.startReading - validatedData.testLiters - validatedData.usageLiters
      : null

    // หาราคาเชื้อเพลิงของผลัดงานนี้
    const shiftPrice = await prisma.shiftFuelPrice.findUnique({
      where: {
        shiftId_fuelTypeId: {
          shiftId,
          fuelTypeId: dispenser.fuelTypeId,
        },
      },
    })

    const totalAmount = totalLiters && shiftPrice 
      ? (totalLiters * shiftPrice.price) - validatedData.discount
      : null

    // บันทึกหรืออัปเดตการอ่านมิเตอร์
    const meterReading = await prisma.meterReading.upsert({
      where: {
        shiftId_dispenserId: {
          shiftId,
          dispenserId: validatedData.dispenserId,
        },
      },
      create: {
        shiftId,
        dispenserId: validatedData.dispenserId,
        startReading: validatedData.startReading,
        endReading: validatedData.endReading,
        testLiters: validatedData.testLiters,
        usageLiters: validatedData.usageLiters,
        discount: validatedData.discount,
        totalLiters,
        totalAmount,
      },
      update: {
        startReading: validatedData.startReading,
        endReading: validatedData.endReading,
        testLiters: validatedData.testLiters,
        usageLiters: validatedData.usageLiters,
        discount: validatedData.discount,
        totalLiters,
        totalAmount,
      },
      include: {
        dispenser: {
          include: {
            fuelType: true,
            tank: true,
          },
        },
      },
    })

    return NextResponse.json(meterReading)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving meter reading:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการอ่านมิเตอร์' },
      { status: 500 }
    )
  }
}