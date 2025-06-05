import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    return NextResponse.json({ ip });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to get IP' }, { status: 500 });
  }
}
