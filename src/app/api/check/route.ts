import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cir_no } = body;

    if (!cir_no) {
      return NextResponse.json({ error: 'CIR No is required' }, { status: 400 });
    }

    const existing = await prisma.cardek.findFirst({
      where: { rept_no: cir_no },
    });

    return NextResponse.json({ exists: !!existing });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
