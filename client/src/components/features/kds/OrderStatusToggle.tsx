"use client"

import { useState } from "react"
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

const ACTION_LABELS: Record<OrderStatus, string> = {
  PENDING: "Accept Order",
  CONFIRMED: "Start Cooking",
  PREPARING: "Ready for Pickup / Dispatch",
  OUT_FOR_DELIVERY: "Mark Delivered",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

const TONES: Record<OrderStatus, string> = {
  PENDING: "bg-[#033921] hover:bg-[#002211] text-[#ffdea4]",
  CONFIRMED: "bg-[#0a2a60] hover:bg-[#061d44] text-[#c7e2ff]",
  PREPARING: "bg-[#5a2300] hover:bg-[#3d1700] text-[#ffb780]",
  OUT_FOR_DELIVERY: "bg-[#3a0f80] hover:bg-[#250854] text-[#e5d2ff]",
  DELIVERED: "bg-[#cde6d5] text-[#063722]",
  CANCELLED: "bg-[#ffd4d4] text-[#6b0e0e]",
}

export function OrderStatusToggle({
  orderId,
  initialStatus,
  onStatusUpdated,
}: {
  orderId: string
  initialStatus: OrderStatus
  onStatusUpdated?: (orderId: string, newStatus: OrderStatus) => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const next = TRANSITIONS[initialStatus]

  if (!next) {
    return (
      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider", TONES[initialStatus])}>
        {initialStatus.replace(/_/g, " ")}
      </span>
    )
  }

  const label = ACTION_LABELS[initialStatus] || `Mark ${next.replace(/_/g, " ")}`

  async function handleAdvance() {
    if (!next || isUpdating) return
    setIsUpdating(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${apiUrl}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        // Fallback to server action
        await updateOrderStatus(orderId, next)
      }
      onStatusUpdated?.(orderId, next)
    } catch {
      await updateOrderStatus(orderId, next)
      onStatusUpdated?.(orderId, next)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleAdvance}
      disabled={isUpdating}
      className={cn(
        "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5",
        TONES[initialStatus] || TONES[next],
      )}
    >
      {isUpdating && <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>}
      <span>{isUpdating ? "Updating..." : label}</span>
    </button>
  )
}

