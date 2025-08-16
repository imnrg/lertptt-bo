import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shiftSchema, updateShiftSchema } from '@/lib/validations'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'

// GET - list shifts, optional ?q=search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    const where = q
      ? {
          name: { contains: q, mode: 'insensitive' as Prisma.QueryMode }
        }
      : undefined

    const shifts = await (prisma as any).shift.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Error fetching shifts', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - create shift
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Basic server-side logging for debugging repeated calls
    try {
      console.debug('[shifts.POST] request body:', body)
      const ua = request.headers.get('user-agent') || 'unknown'
      console.debug('[shifts.POST] user-agent:', ua)
    } catch {
      // ignore logging errors
    }

    try {
      const data = shiftSchema.parse(body)

      // Simple idempotency guard: avoid creating duplicate shifts with same
      // name + startTime within a short window (5 seconds). This prevents
      // rapid duplicate submissions while we investigate client-side behavior.
      const start = new Date(data.startTime)
      const recentWindow = new Date(Date.now() - 5000)
      const existing = await (prisma as any).shift.findFirst({
        where: {
          name: data.name,
          startTime: start,
          createdAt: { gte: recentWindow }
        }
      })
      if (existing) {
        console.info('[shifts.POST] Duplicate create prevented (idempotency guard)')
        return NextResponse.json({ error: 'Duplicate shift' }, { status: 409 })
      }

      // Create shift
      const shift = await (prisma as any).shift.create({
        data: {
          name: data.name,
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : undefined,
          // include description only if present to satisfy generated typings
          ...(data.description ? { description: data.description } : {}),
        }
      })

      // Initialize meters for each dispenser with previous endMeter or 0
      const dispensers = await (prisma as any).dispenser.findMany()
      for (const d of dispensers) {
        const prev = await (prisma as any).shiftMeter.findFirst({
          where: { dispenserId: d.id },
          orderBy: { createdAt: 'desc' }
        })
        await (prisma as any).shiftMeter.create({
          data: {
            shiftId: shift.id,
            dispenserId: d.id,
            tankId: d.tankId,
            fuelTypeId: d.fuelTypeId,
            startMeter: prev?.endMeter ?? 0,
          }
        })
      }

      // Initialize tank checks with previous remaining or tank.currentLevel
      const tanks = await (prisma as any).tank.findMany()
      for (const t of tanks) {
        const prevCheck = await (prisma as any).shiftTankCheck.findFirst({
          where: { tankId: t.id },
          orderBy: { createdAt: 'desc' }
        })
        await (prisma as any).shiftTankCheck.create({
          data: {
            shiftId: shift.id,
            tankId: t.id,
            firstMeasure: prevCheck?.lastMeasure ?? t.currentLevel,
          }
        })
      }

      return NextResponse.json(shift, { status: 201 })
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error creating shift', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - update shift
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    try {
      const data = updateShiftSchema.parse(body)

      const shift = await (prisma as any).shift.update({
        where: { id: data.id },
        data: {
          name: data.name,
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : undefined,
          ...(data.description ? { description: data.description } : {}),
        }
      })

      return NextResponse.json(shift)
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error updating shift', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - delete shift (id in query)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    await (prisma as any).shift.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shift', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
