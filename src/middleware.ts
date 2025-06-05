// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const middleware = withAuth(
  function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    const token = (req as any).nextauth?.token;

    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/',
    },
  },
);

export default middleware;

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/ncr/:path*',
    '/master-kalibrasi',
    '/master-non-kalibrasi',
    '/instrument-issue/register',
  ],
};
