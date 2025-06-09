import NextAuth from 'next-auth';
import { authOptions as authOptionsJS } from '@/lib/authOptions';

import type { AuthOptions } from 'next-auth';

const authOptions = authOptionsJS as AuthOptions;

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
