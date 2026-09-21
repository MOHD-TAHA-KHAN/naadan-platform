"use client"

import { useTransition } from "react"
import { updateOrderStatus } from "@/actions/admin"

const ALL_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={(e) => {
        const val = e.target.value
        startTransition(async () => { await updateOrderStatus(orderId, val) })
      }}
      className="text-xs font-semibold border border-[#c0c9c0] bg-[#fdf9f1] text-[#002211] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#7b5900] disabled:opacity-50 cursor-pointer"
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  )
}
