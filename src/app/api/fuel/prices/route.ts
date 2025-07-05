import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getBangkokTime } from '@/lib/utils'

const fuelPriceSchema = z.object({
  fuelTypeId: z.string().min(1, 'ต้องระบุประเภทเชื้อเพลิง'),
  price: z.number().min(0, 'ราคาต้องมากกว่าหรือเท่ากับ 0'),
})

const bulkFuelPriceSchema = z.object({
  fuelTypes: z.array(z.object({
    fuelTypeId: z.string().min(1, 'ต้องระบุประเภทเชื้อเพลิง'),
    price: z.number().min(0, 'ราคาต้องมากกว่าหรือเท่ากับ 0'),
  })).min(1, 'ต้องมีประเภทเชื้อเพลิงอย่างน้อย 1 รายการ'),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ดึงเฉพาะราคาปัจจุบันที่มีผล
    const now = getBangkokTime()
    const prices = await prisma.fuelPrice.findMany({
      where: {
        isActive: true,
        effectiveDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gt: now } }
        ]
      },
      include: {
        fuelType: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      },
      orderBy: [
        { fuelTypeId: 'asc' },
        { effectiveDate: 'desc' }
      ]
    })

    // Convert dates to Bangkok timezone for response
    const pricesWithBangkokTime = prices.map(price => ({
      ...price,
      effectiveDate: price.effectiveDate.toISOString(),
      endDate: price.endDate?.toISOString() || null,
      createdAt: price.createdAt.toISOString(),
      updatedAt: price.updatedAt.toISOString(),
    }))

    return NextResponse.json(pricesWithBangkokTime)
  } catch (error) {
    console.error('Error fetching fuel prices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if it's bulk update
    const isBulkUpdate = 'fuelTypes' in body
    
    if (isBulkUpdate) {
      // Validate bulk data
      const validatedData = bulkFuelPriceSchema.parse(body)
      
      // ใช้วันที่ปัจจุบันเป็นวันที่มีผล
      const effectiveDate = getBangkokTime()

      // Use transaction for bulk update
      const result = await prisma.$transaction(async (tx) => {
        const newPrices = []
        
        for (const fuelTypeData of validatedData.fuelTypes) {
          // Check if fuel type exists and is active
          const fuelType = await tx.fuelType.findFirst({
            where: {
              id: fuelTypeData.fuelTypeId,
              isActive: true
            }
          })

          if (!fuelType) {
            throw new Error(`ไม่พบประเภทเชื้อเพลิง ID: ${fuelTypeData.fuelTypeId}`)
          }

          // End current active price if exists
          await tx.fuelPrice.updateMany({
            where: {
              fuelTypeId: fuelTypeData.fuelTypeId,
              isActive: true,
              OR: [
                { endDate: null },
                { endDate: { gt: effectiveDate } }
              ]
            },
            data: {
              endDate: effectiveDate,
              updatedAt: effectiveDate
            }
          })

          // Create new price with current date
          const newPrice = await tx.fuelPrice.create({
            data: {
              fuelTypeId: fuelTypeData.fuelTypeId,
              price: fuelTypeData.price,
              effectiveDate,
              endDate: null, // ไม่มีวันสิ้นสุด
              isActive: true,
              createdAt: effectiveDate,
              updatedAt: effectiveDate
            },
            include: {
              fuelType: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              }
            }
          })

          newPrices.push(newPrice)
        }

        return newPrices
      })

      return NextResponse.json(result, { status: 201 })
    } else {
      // Single price update
      const validatedData = fuelPriceSchema.parse(body)
      
      // Check if fuel type exists and is active
      const fuelType = await prisma.fuelType.findFirst({
        where: {
          id: validatedData.fuelTypeId,
          isActive: true
        }
      })

      if (!fuelType) {
        return NextResponse.json(
          { error: 'ไม่พบประเภทเชื้อเพลิงที่ระบุ' },
          { status: 404 }
        )
      }

      // ใช้วันที่ปัจจุบันเป็นวันที่มีผล
      const effectiveDate = getBangkokTime()

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // End current active price if exists
        await tx.fuelPrice.updateMany({
          where: {
            fuelTypeId: validatedData.fuelTypeId,
            isActive: true,
            OR: [
              { endDate: null },
              { endDate: { gt: effectiveDate } }
            ]
          },
          data: {
            endDate: effectiveDate,
            updatedAt: effectiveDate
          }
        })

        // Create new price with current date
        const newPrice = await tx.fuelPrice.create({
          data: {
            fuelTypeId: validatedData.fuelTypeId,
            price: validatedData.price,
            effectiveDate,
            endDate: null, // ไม่มีวันสิ้นสุด
            isActive: true,
            createdAt: effectiveDate,
            updatedAt: effectiveDate
          },
          include: {
            fuelType: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        })

        return newPrice
      })

      return NextResponse.json(result, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating fuel price:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}