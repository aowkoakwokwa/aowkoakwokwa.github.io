// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;

  return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/', baseUrl));
}
