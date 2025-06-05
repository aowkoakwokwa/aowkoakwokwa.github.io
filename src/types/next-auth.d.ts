import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: unknown;
      username: unknown;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      level?: string | null;
      hak_akses?: string | null;
    };
  }

  interface User {
    id: string;
    username: string;
    level?: string | null;
    hak_akses?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    level?: string | null;
    hak_akses?: string | null;
  }
}
