import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedRoutes = [
  '/dashboard',
  '/ncr',
  '/master-kalibrasi',
  '/master-non-kalibrasi',
  '/instrument-issue/register',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname === '/' && token) {
    const cookie = req.headers.get('cookie') || '';
    const currentPageEncoded = cookie
      .split(';')
      .find((c) => c.trim().startsWith('currentPage='))
      ?.split('=')[1];

    if (currentPageEncoded) {
      const currentPage = decodeURIComponent(currentPageEncoded);

      if (currentPage && currentPage !== '/') {
        return NextResponse.redirect(new URL(currentPage, req.url));
      }
    }

    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

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
