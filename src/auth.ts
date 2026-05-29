import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GitHub from 'next-auth/providers/github'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub
      return session
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})
