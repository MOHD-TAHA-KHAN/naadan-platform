"use client"

import { useTransition, useState } from "react"
import { addToCart } from "@/actions/cart"

export function AddToCartButton({ menuItemId, itemName }: { menuItemId: string; itemName: string }) {
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)

  function handleClick() {
    startTransition(async () => {
      const result = await addToCart(menuItemId)
      if (result.success) {
        setAdded(true)
        setTimeout(() => setAdded(false), 1800)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={`Add ${itemName} to cart`}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
        added
          ? "bg-[#baefcb] text-[#002211]"
          : "bg-[#fcca66] text-[#755400] hover:bg-[#f0bf5c]"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isPending ? (
        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
      ) : added ? (
        <span className="material-symbols-outlined text-[16px]">check</span>
      ) : (
        <span className="material-symbols-outlined text-[16px]">add</span>
      )}
      {added ? "Added!" : "Add to Feast"}
    </button>
  )
}
