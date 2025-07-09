import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { debtorSchema } from '@/lib/validations';
import { ZodError } from 'zod';

// GET - List all debtors
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const debtors = await prisma.debtorRecord.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(debtors);
  } catch (error) {
    console.error('Error fetching debtors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new debtor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    try {
      const validatedData = debtorSchema.parse(body);

      const debtor = await prisma.debtorRecord.create({
        data: validatedData,
      });

      return NextResponse.json(debtor, { status: 201 });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            issues: error.issues,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating debtor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}