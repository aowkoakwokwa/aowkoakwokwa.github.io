import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, res: NextResponse) {
  const ip = req.headers.get('x-forwarded-for')?.split('::ffff:').pop();

  return NextResponse.json({ ip }, { status: 200 });
}
