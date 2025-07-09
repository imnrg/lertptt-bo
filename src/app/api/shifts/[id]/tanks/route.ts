import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tankReadingSchema = z.object({
  tankId: z.string().min(1, 'ต้องระบุรหัสถัง'),
  startLevel: z.number().min(0, 'ปริมาณเริ่มต้นต้องไม่ติดลบ'),
  actualLevel: z.number().min(0, 'ปริมาณที่วัดได้ต้องไม่ติดลบ').optional().nullable(),
})

const tankRefillSchema = z.object({
  tankId: z.string().min(1, 'ต้องระบุรหัสถัง'),
  amount: z.number().min(0, 'ปริมาณที่เติมต้องไม่ติดลบ'),
  timestamp: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().optional().nullable(),
})

// GET: ดึงข้อมูลการเปรียบเทียบถังของผลัดงาน
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
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงาน' }, { status: 404 })
    }

    // ดึงข้อมูลการอ่านถัง
    const tankReadings = await prisma.tankReading.findMany({
      where: { shiftId },
      include: {
        tank: {
          include: {
            fuelType: true,
          },
        },
      },
      orderBy: { tank: { name: 'asc' } },
    })

    // ดึงข้อมูลการเติมถังระหว่างผลัด
    const tankRefills = await prisma.tankRefill.findMany({
      where: { shiftId },
      include: {
        tank: {
          include: {
            fuelType: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    })

    // ดึงข้อมูลถังทั้งหมดที่ใช้งานได้
    const tanks = await prisma.tank.findMany({
      where: { isActive: true },
      include: {
        fuelType: true,
      },
      orderBy: { name: 'asc' },
    })

    // คำนวณปริมาณที่ใช้ไปจากการอ่านมิเตอร์
    const meterReadings = await prisma.meterReading.findMany({
      where: { shiftId },
      include: {
        dispenser: {
          include: {
            tank: true,
            fuelType: true,
          },
        },
      },
    })

    // คำนวณปริมาณที่ใช้ต่อถัง
    const usageByTank = new Map<string, number>()
    meterReadings.forEach((reading) => {
      if (reading.totalLiters) {
        const currentUsage = usageByTank.get(reading.dispenser.tankId) || 0
        usageByTank.set(reading.dispenser.tankId, currentUsage + reading.totalLiters)
      }
    })

    return NextResponse.json({
      shift,
      tankReadings,
      tankRefills,
      tanks,
      usageByTank: Object.fromEntries(usageByTank),
    })
  } catch (error) {
    console.error('Error fetching tank readings:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการเปรียบเทียบถัง' },
      { status: 500 }
    )
  }
}

// POST: เพิ่มหรืออัปเดตการอ่านถัง
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
    const { action } = body

    if (action === 'refill') {
      // เพิ่มการเติมถัง
      const validatedData = tankRefillSchema.parse(body)

      const tankRefill = await prisma.tankRefill.create({
        data: {
          shiftId,
          tankId: validatedData.tankId,
          amount: validatedData.amount,
          timestamp: validatedData.timestamp || new Date(),
          notes: validatedData.notes,
        },
        include: {
          tank: {
            include: {
              fuelType: true,
            },
          },
        },
      })

      return NextResponse.json(tankRefill)
    } else {
      // อัปเดตการอ่านถัง
      const validatedData = tankReadingSchema.parse(body)

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

      // คำนวณปริมาณที่คาดว่าจะเหลือ
      const meterReadings = await prisma.meterReading.findMany({
        where: { 
          shiftId,
          dispenser: { tankId: validatedData.tankId },
        },
      })

      const tankRefills = await prisma.tankRefill.findMany({
        where: { 
          shiftId,
          tankId: validatedData.tankId,
        },
      })

      const totalUsage = meterReadings.reduce((sum, reading) => {
        return sum + (reading.totalLiters || 0) + reading.testLiters + reading.usageLiters
      }, 0)

      const totalRefills = tankRefills.reduce((sum, refill) => sum + refill.amount, 0)

      const calculatedLevel = validatedData.startLevel + totalRefills - totalUsage

      // คำนวณส่วนต่าง
      const difference = validatedData.actualLevel ? validatedData.actualLevel - calculatedLevel : null
      const differencePercent = difference && calculatedLevel > 0 
        ? (difference / calculatedLevel) * 100 
        : null

      // บันทึกหรืออัปเดตการอ่านถัง
      const tankReading = await prisma.tankReading.upsert({
        where: {
          shiftId_tankId: {
            shiftId,
            tankId: validatedData.tankId,
          },
        },
        create: {
          shiftId,
          tankId: validatedData.tankId,
          startLevel: validatedData.startLevel,
          calculatedLevel,
          actualLevel: validatedData.actualLevel,
          difference,
          differencePercent,
        },
        update: {
          startLevel: validatedData.startLevel,
          calculatedLevel,
          actualLevel: validatedData.actualLevel,
          difference,
          differencePercent,
        },
        include: {
          tank: {
            include: {
              fuelType: true,
            },
          },
        },
      })

      return NextResponse.json(tankReading)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error saving tank reading:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการอ่านถัง' },
      { status: 500 }
    )
  }
}