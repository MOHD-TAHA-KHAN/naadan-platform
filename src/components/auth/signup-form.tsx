"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signupAction, type ActionState } from "@/actions/auth"

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    signupAction,
    null
  )

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#ffffff] border border-[#c0c9c0]/50 shadow-xl rounded-2xl p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-[#033921] flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#ffdea4] text-[28px]">restaurant_menu</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
            Join Naadan
          </h1>
          <p className="text-sm text-[#717972] mt-1">Order authentic Kerala cuisine in Nagpur</p>
        </div>

        {state?.error && !state?.fieldErrors && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#ba1a1a]/20 bg-[#ffdad6] p-3 text-sm text-[#93000a]">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {[
            { id: "name", label: "Full Name", type: "text", placeholder: "Anoop Nair", autoComplete: "name" },
            { id: "email", label: "Email Address", type: "email", placeholder: "anoop@example.com", autoComplete: "email" },
            { id: "password", label: "Password (min. 8 chars)", type: "password", placeholder: "••••••••", autoComplete: "new-password" },
            { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••", autoComplete: "new-password" },
          ].map(({ id, label, type, placeholder, autoComplete }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
                {label}
              </label>
              <input
                id={id} name={id} type={type} autoComplete={autoComplete} required placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 rounded-lg border ${
                  state?.fieldErrors?.[id] ? "border-[#ba1a1a]" : "border-[#c0c9c0]"
                } bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all`}
              />
              {state?.fieldErrors?.[id] && (
                <p className="mt-1 text-xs text-[#ba1a1a]">{state.fieldErrors[id]}</p>
              )}
            </div>
          ))}

          <button
            type="submit" disabled={isPending}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#033921] hover:bg-[#002211] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Creating account...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-[#717972]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#7b5900] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
