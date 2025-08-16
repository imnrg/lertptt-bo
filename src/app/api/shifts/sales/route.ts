import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shiftSaleSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')

    if (!shiftId) return NextResponse.json({ error: 'Missing shiftId' }, { status: 400 })

    const sales = await prisma.shiftSale.findMany({ where: { shiftId } })
    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error fetching shift sales', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    try {
      const data = shiftSaleSchema.parse(body)

      // calculate totals
      const total = data.quantity * data.unitPrice
      const net = total - (data.discount ?? 0)

      const created = await prisma.shiftSale.create({
        data: {
          ...data,
          total,
          netTotal: net,
        }
      })
      return NextResponse.json(created, { status: 201 })
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error creating shift sale', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    try {
      const data = shiftSaleSchema.parse(body)

      const total = data.quantity * data.unitPrice
      const net = total - (data.discount ?? 0)

      const updated = await prisma.shiftSale.update({ where: { id: body.id }, data: { ...data, total, netTotal: net } })
      return NextResponse.json(updated)
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error updating shift sale', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    await prisma.shiftSale.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shift sale', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
