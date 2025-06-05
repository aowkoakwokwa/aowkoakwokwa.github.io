// /app/api/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  const user = await prisma.user.findFirst({
    where: { username, password },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const idToken = randomUUID();
  console.log(idToken);

  await prisma.session.create({
    data: {
      id_token: idToken,
      sessionToken: idToken,
      id_user: user.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  (await cookies()).set({
    name: 'id_token',
    value: idToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return NextResponse.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      level: user.user_level,
      hak_akses: user.hak_akses,
    },
  });
}
