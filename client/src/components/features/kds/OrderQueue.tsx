"use client"

import { TicketCard } from "./TicketCard"
import type { KdsTicket } from "./types"

const STAGES = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] as const

const STAGE_HEADERS: Record<(typeof STAGES)[number], { label: string; tint: string }> = {
  PENDING:          { label: "Order Received", tint: "bg-[#fcca66]/20 text-[#755400]" },
  CONFIRMED:        { label: "Confirmed",      tint: "bg-[#c7e2ff]/25 text-[#0a2a60]" },
  PREPARING:        { label: "Cooking",        tint: "bg-[#ffb780]/20 text-[#5a2300]" },
  OUT_FOR_DELIVERY: { label: "Out For Delivery", tint: "bg-[#e5d2ff]/25 text-[#3a0f80]" },
}

export function OrderQueue({ tickets }: { tickets: KdsTicket[] }) {
  return (
    <section className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {STAGES.map((stage) => {
        const header = STAGE_HEADERS[stage]
        const stageTickets = tickets.filter((t) => t.status === stage)
        return (
          <div
            key={stage}
            className="bg-[#ffffff] rounded-xl border border-[#f1ede6] shadow-sm min-h-[220px] overflow-hidden"
          >
            <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#f1ede6] bg-[#fbf7ee]">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${header.tint}`}>
                {header.label}
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#002211]">
                {stageTickets.length}
              </span>
            </header>
            <div className="p-3 space-y-3">
              {stageTickets.length === 0 ? (
                <p className="text-[12px] text-[#717972] text-center py-6">No tickets</p>
              ) : (
                stageTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}
