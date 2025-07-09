import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const saleItemSchema = z.object({
  productId: z.string().min(1, 'ต้องระบุรหัสสินค้า'),
  quantity: z.number().min(0.01, 'จำนวนต้องมากกว่า 0'),
  unitPrice: z.number().min(0, 'ราคาต่อหน่วยต้องไม่ติดลบ'),
  discount: z.number().min(0, 'ส่วนลดต้องไม่ติดลบ').default(0),
})

const saleSchema = z.object({
  billNumber: z.string().min(1, 'ต้องระบุเลขบิล'),
  licensePlate: z.string().optional().nullable(),
  paymentType: z.enum(['CASH', 'CREDIT']).default('CASH'),
  debtorId: z.string().optional().nullable(),
  discount: z.number().min(0, 'ส่วนลดต้องไม่ติดลบ').default(0),
  notes: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
})

// GET: ดึงข้อมูลการขายของผลัดงาน
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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    // ดึงข้อมูลการขาย
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { shiftId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          debtor: {
            select: {
              id: true,
              customerName: true,
              customerPhone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where: { shiftId } }),
    ])

    // คำนวณสรุปยอดขาย
    const salesSummary = await prisma.sale.groupBy({
      by: ['paymentType'],
      where: { shiftId },
      _sum: {
        total: true,
      },
    })

    type SalesSummaryItem = {
      paymentType: 'CASH' | 'CREDIT'
      _sum: { total: number | null }
    }

    const summary = {
      cashSales: salesSummary.find((s: SalesSummaryItem) => s.paymentType === 'CASH')?._sum.total || 0,
      creditSales: salesSummary.find((s: SalesSummaryItem) => s.paymentType === 'CREDIT')?._sum.total || 0,
      totalSales: salesSummary.reduce((sum: number, s: SalesSummaryItem) => sum + (s._sum.total || 0), 0),
      totalTransactions: total,
    }

    // ดึงข้อมูลสินค้าที่ใช้งานได้
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        prices: {
          where: {
            isActive: true,
            effectiveDate: { lte: new Date() },
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
        fuelType: true,
      },
      orderBy: { name: 'asc' },
    })

    // ดึงข้อมูลลูกหนี้
    const debtors = await prisma.debtorRecord.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        amount: true,
      },
      orderBy: { customerName: 'asc' },
    })

    return NextResponse.json({
      shift,
      sales,
      summary,
      products,
      debtors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการขาย' },
      { status: 500 }
    )
  }
}

// POST: เพิ่มการขายใหม่
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
    const validatedData = saleSchema.parse(body)

    // ตรวจสอบว่าผลัดงานมีอยู่และยังใช้งานได้
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    })

    if (!shift) {
      return NextResponse.json({ error: 'ไม่พบผลัดงาน' }, { status: 404 })
    }

    if (shift.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'สามารถเพิ่มการขายได้เฉพาะผลัดงานที่กำลังใช้งาน' },
        { status: 400 }
      )
    }

    // ตรวจสอบเลขบิลซ้ำ
    const existingSale = await prisma.sale.findUnique({
      where: { billNumber: validatedData.billNumber },
    })

    if (existingSale) {
      return NextResponse.json(
        { error: 'เลขบิลนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // ตรวจสอบลูกหนี้ (ถ้าเป็นการขายเครดิต)
    if (validatedData.paymentType === 'CREDIT' && !validatedData.debtorId) {
      return NextResponse.json(
        { error: 'ต้องระบุรหัสลูกหนี้สำหรับการขายแบบเครดิต' },
        { status: 400 }
      )
    }

    // ตรวจสอบสินค้าและราคา
    const productIds = validatedData.items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        isActive: true,
      },
      include: {
        prices: {
          where: {
            isActive: true,
            effectiveDate: { lte: new Date() },
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
      },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'พบสินค้าที่ไม่ถูกต้องหรือไม่ใช้งาน' },
        { status: 400 }
      )
    }

    // คำนวณยอดรวม
    let subtotal = 0
    const saleItems = validatedData.items.map(item => {
      const product = products.find(p => p.id === item.productId)!
      const itemTotal = (item.quantity * item.unitPrice) - item.discount
      subtotal += itemTotal

      return {
        productId: item.productId,
        productCode: product.code,
        productName: product.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discount: item.discount,
        total: itemTotal,
      }
    })

    const total = subtotal - validatedData.discount

    // บันทึกการขาย
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          shiftId,
          billNumber: validatedData.billNumber,
          licensePlate: validatedData.licensePlate,
          paymentType: validatedData.paymentType,
          debtorId: validatedData.debtorId,
          subtotal,
          discount: validatedData.discount,
          total,
          notes: validatedData.notes,
        },
      })

      await tx.saleItem.createMany({
        data: saleItems.map(item => ({
          saleId: newSale.id,
          ...item,
        })),
      })

      // อัปเดตยอดขายในผลัดงาน
      const salesSummary = await tx.sale.groupBy({
        by: ['paymentType'],
        where: { shiftId },
        _sum: { total: true },
      })

      type SalesSummaryItem = {
        paymentType: 'CASH' | 'CREDIT'
        _sum: { total: number | null }
      }

      const cashSales = salesSummary.find((s: SalesSummaryItem) => s.paymentType === 'CASH')?._sum.total || 0
      const creditSales = salesSummary.find((s: SalesSummaryItem) => s.paymentType === 'CREDIT')?._sum.total || 0
      const totalSales = cashSales + creditSales

      await tx.shift.update({
        where: { id: shiftId },
        data: {
          cashSales,
          creditSales,
          totalSales,
        },
      })

      return await tx.sale.findUnique({
        where: { id: newSale.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          debtor: {
            select: {
              id: true,
              customerName: true,
              customerPhone: true,
            },
          },
        },
      })
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกการขาย' },
      { status: 500 }
    )
  }
}