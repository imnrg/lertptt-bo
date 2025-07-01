import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fuelOnly = searchParams.get('fuelOnly')
    const excludeFuel = searchParams.get('excludeFuel')

    const whereClause: {
      isActive: boolean
      fuelTypeId?: { not: null } | null
    } = {
      isActive: true
    }

    // หากต้องการเฉพาะผลิตภัณฑ์น้ำมัน
    if (fuelOnly === 'true') {
      whereClause.fuelTypeId = {
        not: null
      }
    }

    // หากต้องการยกเว้นผลิตภัณฑ์น้ำมัน
    if (excludeFuel === 'true') {
      whereClause.fuelTypeId = null
    }

    const products = await prisma.product.findMany({
      where: whereClause,
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
        { fuelType: { name: 'asc' } },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}