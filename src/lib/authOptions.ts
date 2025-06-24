import CredentialsProvider from 'next-auth/providers/credentials';
import type { SessionStrategy, AuthOptions, User, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const forwarded = req?.headers?.['x-forwarded-for'];
        let ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : 'Tidak diketahui';
        if (ip.startsWith('::ffff:')) ip = ip.substring(7).trim();

        if (!credentials?.username || !credentials?.password || !ip) {
          throw new Error('Username and password required Or Pc Not Yours');
        }

        const user = await prisma.user.findFirst({
          where: {
            username: credentials.username,
            password: credentials.password,
          },
        });

        if (!user) return null;

        return {
          id: user.id,
          username: user.username,
          hak_akses: user.hak_akses ?? null,
          user_level: user.user_level ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
