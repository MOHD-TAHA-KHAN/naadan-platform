"use client"

import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { TicketCard } from "./TicketCard"
import type { KdsTicket, OrderStatus } from "./types"

const STAGES = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] as const

const STAGE_HEADERS: Record<(typeof STAGES)[number], { label: string; tint: string }> = {
  PENDING:          { label: "ORDER RECEIVED", tint: "bg-[#fcca66]/20 text-[#755400]" },
  CONFIRMED:        { label: "CONFIRMED",      tint: "bg-[#c7e2ff]/25 text-[#0a2a60]" },
  PREPARING:        { label: "COOKING",        tint: "bg-[#ffb780]/20 text-[#5a2300]" },
  OUT_FOR_DELIVERY: { label: "OUT FOR DELIVERY", tint: "bg-[#e5d2ff]/25 text-[#3a0f80]" },
}

export function OrderQueue({ tickets: initialTickets = [] }: { tickets: KdsTicket[] }) {
  const [orders, setOrders] = useState<KdsTicket[]>(initialTickets)

  // 1. Dual Hydration: Initial REST Fetch on mount
  useEffect(() => {
    async function fetchActiveOrders() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders?active=true`)
        if (res.ok) {
          const data = await res.json()
          const list = data.orders || (Array.isArray(data) ? data : [])
          setOrders(list)
        }
      } catch (err) {
        console.error("Failed to load initial KDS orders", err)
      }
    }
    fetchActiveOrders()
  }, [])

  // 2. Dual Hydration: Real-Time Sync via Socket.io
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    })

    socket.on("order:created", (order: KdsTicket) => {
      setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)])
    })

    socket.on("order:status_updated", (order: KdsTicket) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)))
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Update active count badge in header
  useEffect(() => {
    const el = document.getElementById("kds-active-count")
    if (el) {
      const activeCount = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length
      el.textContent = `${activeCount} active`
    }
  }, [orders])

  const handleStatusUpdated = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  return (
    <section className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {STAGES.map((stage) => {
        const header = STAGE_HEADERS[stage]
        const stageTickets = orders.filter((t) => t.status === stage)
        return (
          <div
            key={stage}
            className="bg-[#ffffff] rounded-xl border border-[#f1ede6] shadow-sm min-h-[220px] overflow-hidden flex flex-col"
          >
            <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1ede6] bg-[#fbf7ee]">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${header.tint}`}>
                {header.label}
              </span>
              <span className="text-[11px] font-mono font-bold text-[#002211]">
                {stageTickets.length}
              </span>
            </header>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
              {stageTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[#717972]">
                  <span className="material-symbols-outlined text-[32px] text-[#c0c9c0] mb-1">
                    inbox
                  </span>
                  <p className="text-[12px] font-medium">No tickets</p>
                </div>
              ) : (
                stageTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onStatusUpdated={handleStatusUpdated}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}
