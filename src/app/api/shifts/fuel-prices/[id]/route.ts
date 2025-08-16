import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shiftFuelPriceUpdateSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    try {
      const data = shiftFuelPriceUpdateSchema.parse({ id: params.id, ...body })

      const updated = await (prisma as any).shiftFuelPrice.update({
        where: { id: data.id },
        data: { price: data.price }
      })

      return NextResponse.json(updated)
    } catch (err) {
      if (err instanceof ZodError) return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      throw err
    }
  } catch (error) {
    console.error('Error updating shift fuel price', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Delete disabled' }, { status: 405 })
}
