"use client"

import { useTransition } from "react"
import { updateOrderStatus } from "@/actions/admin"
import { cn } from "@/components/ui"
import type { OrderStatus } from "./types"

const TRANSITIONS: Record<OrderStatus, OrderStatus | null> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
}

const TONES: Record<OrderStatus, string> = {
  PENDING: "bg-[#fcca66] hover:bg-[#f6c054] text-[#755400]",
  CONFIRMED: "bg-[#c7e2ff] hover:bg-[#b6d5ff] text-[#0a2a60]",
  PREPARING: "bg-[#ffb780] hover:bg-[#ffa766] text-[#5a2300]",
  OUT_FOR_DELIVERY: "bg-[#e5d2ff] hover:bg-[#d8c0ff] text-[#3a0f80]",
  DELIVERED: "bg-[#cde6d5] text-[#063722]",
  CANCELLED: "bg-[#ffd4d4] text-[#6b0e0e]",
}

export function OrderStatusToggle({
  orderId,
  initialStatus,
}: {
  orderId: string
  initialStatus: OrderStatus
}) {
  const [isPending, startTransition] = useTransition()
  const next = TRANSITIONS[initialStatus]

  if (!next) {
    return (
      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider", TONES[initialStatus])}>
        {initialStatus.replace(/_/g, " ")}
      </span>
    )
  }

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await updateOrderStatus(orderId, next)
        })
      }}
      disabled={isPending}
      className={cn(
        "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-70",
        TONES[next],
      )}
    >
      {isPending ? "…" : `Mark ${next.replace(/_/g, " ")}`}
    </button>
  )
}
