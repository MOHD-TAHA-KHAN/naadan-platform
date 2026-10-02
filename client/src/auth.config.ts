import type { NextAuthConfig } from "next-auth"
import { Role } from "@/types/auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user.role as Role) ?? Role.USER
        if (user.email) token.email = user.email
        if (user.name) token.name = user.name
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? session.user.id
        session.user.email = (token.email as string) ?? session.user.email
        session.user.name = (token.name as string) ?? session.user.name
        session.user.role = (token.role as Role) ?? Role.USER
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdminRoute = nextUrl.pathname.startsWith("/admin")
      const isAuthRoute =
        nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/signup")

      if (isAdminRoute) {
        if (!isLoggedIn) return false
        if (auth?.user?.role !== "ADMIN") return Response.redirect(new URL("/", nextUrl))
        return true
      }

      if (isAuthRoute && isLoggedIn) {
        if (auth?.user?.role === "ADMIN") return Response.redirect(new URL("/admin", nextUrl))
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
  },
  providers: [],
}
