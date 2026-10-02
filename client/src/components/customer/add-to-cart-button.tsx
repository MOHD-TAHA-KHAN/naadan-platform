"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { addToCart } from "../../actions/cart"

export function AddToCartButton({ menuItemId, itemName }: { menuItemId: string; itemName: string }) {
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await addToCart(menuItemId)
      if (result.success) {
        setAdded(true)
        setTimeout(() => setAdded(false), 1800)
      } else if (
        result.code === "UNAUTHENTICATED" ||
        result.code === "SESSION_STALE" ||
        result.error === "Please log in first."
      ) {
        // Redirect to login page so user can authenticate and return seamlessly
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "/menu"
        router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      } else {
        setErrorMsg(result.error || "Failed to add")
        setTimeout(() => setErrorMsg(null), 2500)
      }
    })
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        disabled={isPending}
        aria-label={`Add ${itemName} to cart`}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          added
            ? "bg-[#baefcb] text-[#002211]"
            : errorMsg
              ? "bg-[#ffdad6] text-[#ba1a1a]"
              : "bg-[#fcca66] text-[#755400] hover:bg-[#f0bf5c]"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isPending ? (
          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
        ) : added ? (
          <span className="material-symbols-outlined text-[16px]">check</span>
        ) : errorMsg ? (
          <span className="material-symbols-outlined text-[16px]">error</span>
        ) : (
          <span className="material-symbols-outlined text-[16px]">add</span>
        )}
        {added ? "Added!" : errorMsg ? errorMsg : "Add to Feast"}
      </button>
    </div>
  )
}
