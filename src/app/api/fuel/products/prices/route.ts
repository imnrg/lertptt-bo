import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { productPriceSchema, bulkPriceUpdateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const effectiveDate = searchParams.get('effectiveDate')

    const whereClause: Record<string, unknown> = { 
      isActive: true,
      // กรองเฉพาะผลิตภัณฑ์ที่เป็นน้ำมัน (มี fuelTypeId)
      product: {
        fuelTypeId: {
          not: null
        }
      }
    }

    if (productId) {
      whereClause.productId = productId
    }

    if (effectiveDate) {
      whereClause.effectiveDate = {
        lte: new Date(effectiveDate)
      }
    }

    const prices = await prisma.productPrice.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            fuelType: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        }
      },
      orderBy: [
        { productId: 'asc' },
        { effectiveDate: 'desc' }
      ]
    })

    return NextResponse.json(prices)
  } catch (error) {
    console.error('Error fetching fuel product prices:', error)
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
    
    // Check if this is a bulk update or single price update
    if (body.products && Array.isArray(body.products)) {
      // Bulk price update
      const validatedData = bulkPriceUpdateSchema.parse(body)
      
      const effectiveDate = new Date(validatedData.effectiveDate)
      const endDate = validatedData.endDate ? new Date(validatedData.endDate) : null

      // Validate all products exist and are fuel products
      const productIds = validatedData.products.map(p => p.productId)
      const products = await prisma.product.findMany({
        where: { 
          id: { in: productIds },
          fuelTypeId: { not: null } // ต้องเป็นผลิตภัณฑ์น้ำมัน
        },
        include: {
          fuelType: true
        }
      })

      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: 'มีผลิตภัณฑ์บางรายการที่ไม่พบในระบบหรือไม่ใช่ผลิตภัณฑ์น้ำมัน' },
          { status: 400 }
        )
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deactivate current active prices for these products
        await tx.productPrice.updateMany({
          where: {
            productId: { in: productIds },
            isActive: true,
            effectiveDate: { lte: effectiveDate }
          },
          data: {
            isActive: false,
            endDate: effectiveDate
          }
        })

        // Create new prices
        const newPrices = await Promise.all(
          validatedData.products.map(productData =>
            tx.productPrice.create({
              data: {
                productId: productData.productId,
                price: productData.price,
                effectiveDate,
                endDate,
                isActive: true,
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    fuelType: {
                      select: {
                        id: true,
                        name: true,
                        code: true,
                      }
                    }
                  }
                }
              }
            })
          )
        )

        return newPrices
      })

      return NextResponse.json(result, { status: 201 })
    } else {
      // Single price update
      const validatedData = productPriceSchema.parse(body)
      
      // Validate product exists and is a fuel product
      const product = await prisma.product.findUnique({
        where: { id: validatedData.productId },
        include: {
          fuelType: true
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'ไม่พบผลิตภัณฑ์ที่ระบุ' },
          { status: 400 }
        )
      }

      if (!product.fuelTypeId) {
        return NextResponse.json(
          { error: 'ผลิตภัณฑ์ที่เลือกไม่ใช่ผลิตภัณฑ์น้ำมัน' },
          { status: 400 }
        )
      }

      const effectiveDate = new Date(validatedData.effectiveDate)
      const endDate = validatedData.endDate ? new Date(validatedData.endDate) : null

      const result = await prisma.$transaction(async (tx) => {
        // Deactivate current active price
        await tx.productPrice.updateMany({
          where: {
            productId: validatedData.productId,
            isActive: true,
            effectiveDate: { lte: effectiveDate }
          },
          data: {
            isActive: false,
            endDate: effectiveDate
          }
        })

        // Create new price
        const newPrice = await tx.productPrice.create({
          data: {
            productId: validatedData.productId,
            price: validatedData.price,
            effectiveDate,
            endDate,
            isActive: true,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                fuelType: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  }
                }
              }
            }
          }
        })

        return newPrice
      })

      return NextResponse.json(result, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating fuel product price:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}