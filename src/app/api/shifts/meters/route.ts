import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shiftMeterSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')

    if (!shiftId) return NextResponse.json({ error: 'Missing shiftId' }, { status: 400 })

    // include relations so client can display names
    const meters = await prisma.shiftMeter.findMany({ where: { shiftId }, include: { dispenser: true, tank: true, fuelType: true } })
    return NextResponse.json(meters)
  } catch (error) {
    console.error('Error fetching shift meters', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    try {
      const data = shiftMeterSchema.parse(body)

      const created = await prisma.shiftMeter.create({ data })
      return NextResponse.json(created, { status: 201 })
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error creating shift meter', error)
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
      const data = shiftMeterSchema.parse(body)

      // compute sold volume based on meters and withdrawals
      const end = data.endMeter ?? data.startMeter
      const soldVolume = (end - data.startMeter - (data.testWithdraw ?? 0) - (data.useWithdraw ?? 0)) || 0

      // try to find stamped price for this shift and fuel type to compute amount
      let amount: number | null = null
      try {
        const priceRecord = await (prisma as any).shiftFuelPrice.findFirst({ where: { shiftId: data.shiftId, fuelTypeId: data.fuelTypeId }, orderBy: { createdAt: 'desc' } })
        if (priceRecord) {
          amount = soldVolume * priceRecord.price
        }
      } catch (err) {
        console.warn('Failed to lookup shift fuel price', err)
      }

      const updated = await prisma.shiftMeter.update({
        where: { id: body.id },
        data: {
          ...data,
          soldVolume,
          amount,
        },
        include: { dispenser: true, tank: true, fuelType: true },
      })
      return NextResponse.json(updated)
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error updating shift meter', error)
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

    await prisma.shiftMeter.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shift meter', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
