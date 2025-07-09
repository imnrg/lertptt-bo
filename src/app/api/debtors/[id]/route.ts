import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { debtorSchema } from '@/lib/validations';
import { ZodError } from 'zod';

// GET - Get single debtor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const debtor = await prisma.debtorRecord.findUnique({
      where: { id }
    });

    if (!debtor) {
      return NextResponse.json({ error: 'Debtor not found' }, { status: 404 });
    }

    return NextResponse.json(debtor);
  } catch (error) {
    console.error('Error fetching debtor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update debtor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    try {
      const validatedData = debtorSchema.parse(body);
      
      const debtor = await prisma.debtorRecord.update({
        where: { id },
        data: validatedData
      });

      return NextResponse.json(debtor);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            issues: error.issues 
          }, 
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating debtor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete debtor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.debtorRecord.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Debtor deleted successfully' });
  } catch (error) {
    console.error('Error deleting debtor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}