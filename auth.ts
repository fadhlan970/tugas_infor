import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email dan kata sandi",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Kata sandi", type: "password" }, portal: { label: "Jenis akun", type: "text" } },
      async authorize(credentials) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(1), portal: z.enum(["ADMIN", "STUDENT"]) }).safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, include: { member: true } });
        if (!user || !user.isActive || !user.passwordHash || !(await compare(parsed.data.password, user.passwordHash))) return null;
        const roleMatchesPortal = parsed.data.portal === "ADMIN" ? ["ADMIN", "STAFF"].includes(user.role) : ["STUDENT", "TEACHER"].includes(user.role);
        if (!roleMatchesPortal) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, memberId: user.member?.id ?? null };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as typeof user & { role?: string }).role;
        token.memberId = (user as typeof user & { memberId?: string | null }).memberId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "ADMIN" | "STAFF" | "STUDENT" | "TEACHER") ?? "STUDENT";
        session.user.memberId = (token.memberId as string | null) ?? null;
      }
      return session;
    },
  },
});
