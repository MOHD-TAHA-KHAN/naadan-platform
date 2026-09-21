"use client"

import { useTransition } from "react"
import { logoutAction } from "@/actions/auth"

export function LogoutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={isPending}
      className={
        className ??
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] hover:bg-[#f1ede6] text-sm font-medium text-[#002211] transition-colors cursor-pointer disabled:opacity-50"
      }
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
          Logging out...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Log out
        </span>
      )}
    </button>
  )
}
