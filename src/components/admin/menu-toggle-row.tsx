"use client"

import { useTransition, useState } from "react"
import { toggleMenuItemAvailability } from "@/actions/admin"

interface MenuToggleRowProps {
  item: {
    id: string
    name: string
    description: string | null
    price: { toString(): string }
    available: boolean
  }
}

export function MenuToggleRow({ item }: MenuToggleRowProps) {
  const [isPending, startTransition] = useTransition()
  const [available, setAvailable] = useState(item.available)

  function toggle() {
    const next = !available
    setAvailable(next)
    startTransition(async () => {
      const result = await toggleMenuItemAvailability(item.id, next)
      if (result.error) setAvailable(!next) // revert on error
    })
  }

  return (
    <div className={`px-5 py-3 flex items-center justify-between gap-4 transition-colors ${!available ? "bg-[#fdf9f1] opacity-70" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-[#002211] truncate">{item.name}</p>
          {!available && (
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-semibold uppercase">86&apos;d</span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-[#717972] line-clamp-1 mt-0.5">{item.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono font-semibold text-sm text-[#002211]">
          ₹{Number(item.price).toFixed(0)}
        </span>
        <button
          onClick={toggle}
          disabled={isPending}
          aria-label={available ? "Mark as unavailable" : "Mark as available"}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
            available ? "bg-[#38684c]" : "bg-[#c0c9c0]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              available ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-xs font-semibold w-16 ${available ? "text-[#38684c]" : "text-[#717972]"}`}>
          {isPending ? "Updating..." : available ? "Available" : "Unavailable"}
        </span>
      </div>
    </div>
  )
}
