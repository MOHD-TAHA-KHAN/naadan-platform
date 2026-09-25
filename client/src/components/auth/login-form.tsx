"use client"

import { useActionState } from "react"
import Link from "next/link"
import { loginAction, type ActionState } from "../../actions/auth"

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
