import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Sign In | Naadan" }

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    if (session.user.role === "ADMIN") redirect("/admin")
    redirect("/")
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#fdf9f1]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#fcca66]/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#033921]/5 blur-3xl" />
      </div>
      <LoginForm />
    </main>
  )
}
