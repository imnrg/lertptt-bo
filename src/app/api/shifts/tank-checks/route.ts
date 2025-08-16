import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { shiftTankCheckSchema } from '@/lib/validations'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')

    if (!shiftId) return NextResponse.json({ error: 'Missing shiftId' }, { status: 400 })

    const checks = await prisma.shiftTankCheck.findMany({ where: { shiftId } })
    return NextResponse.json(checks)
  } catch (error) {
    console.error('Error fetching tank checks', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    try {
      const data = shiftTankCheckSchema.parse(body)

      const created = await prisma.shiftTankCheck.create({ data })
      return NextResponse.json(created, { status: 201 })
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error creating tank check', error)
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
      const data = shiftTankCheckSchema.parse(body)
      const updated = await prisma.shiftTankCheck.update({ where: { id: body.id }, data })
      return NextResponse.json(updated)
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 })
      }
      throw err
    }
  } catch (error) {
    console.error('Error updating tank check', error)
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

    await prisma.shiftTankCheck.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tank check', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
