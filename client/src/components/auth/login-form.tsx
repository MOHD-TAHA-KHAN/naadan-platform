"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { loginAction, type ActionState } from "@/actions/auth"

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    loginAction,
    null
  )

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#ffffff] border border-[#c0c9c0]/50 shadow-xl rounded-2xl p-8">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-[#033921] flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#ffdea4] text-[28px]">soup_kitchen</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
            Welcome to Naadan
          </h1>
          <p className="text-sm text-[#717972] mt-1">
            Authentic Kerala Cloud Kitchen • Nagpur
          </p>
        </div>

        {state?.error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#ba1a1a]/20 bg-[#ffdad6] p-3 text-sm text-[#93000a]">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
              Email Address
            </label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
              Password
            </label>
            <input
              id="password" name="password" type="password" autoComplete="current-password" required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit" disabled={isPending}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#033921] hover:bg-[#002211] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Signing in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">login</span>
                Sign in to Naadan
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#c0c9c0]/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#ffffff] px-2 text-[#717972]">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={() => signIn("google", { redirectTo: "/admin" })}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-[#c0c9c0] bg-white hover:bg-[#f7f3eb] px-4 py-2.5 text-sm font-semibold text-[#1c1c17] shadow-sm transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Credentials hint */}
        <div className="mt-5 rounded-lg bg-[#f7f3eb] p-3 text-xs text-[#414942] border border-[#c0c9c0]/40">
          <p className="font-semibold text-[#002211] mb-0.5">Demo Accounts:</p>
          <p>Admin — <span className="font-mono text-[#7b5900]">admin@naadan.com</span> / <span className="font-mono text-[#7b5900]">Test12345</span></p>
          <p className="mt-0.5">Customer — sign up below</p>
        </div>

        <div className="mt-5 text-center text-sm text-[#717972]">
          New to Naadan?{" "}
          <Link href="/signup" className="font-semibold text-[#7b5900] hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
