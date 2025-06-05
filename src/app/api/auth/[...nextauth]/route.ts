import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

type CustomUser = {
  id: string;
  username: string;
  user_level: string | null;
  hak_akses: string | null;
};

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

        if (ip.startsWith('::ffff:')) {
          ip = ip.substring(7).trim();
        }

        if (!credentials?.username || !credentials?.password || !ip) {
          throw new Error('Username and password required Or Pc Not Yours');
        }

        const user = await prisma.user.findFirst({
          where: {
            username: credentials.username,
            password: credentials.password,
            pc_name: ip,
          },
        });

        if (!user) {
          return null;
        }

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
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
