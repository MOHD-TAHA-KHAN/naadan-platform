"use client"

import { cn } from "@/components/ui"
import { OrderStatusToggle } from "./OrderStatusToggle"
import { formatTimeInQueue } from "@/utils"
import type { KdsTicket, OrderStatus } from "./types"

const statusMeta: Record<OrderStatus, { label: string; tone: string; accent: string }> = {
  PENDING:          { label: "New",        tone: "bg-[#fcca66] text-[#755400]", accent: "border-l-[#fcca66]" },
  CONFIRMED:        { label: "Confirmed",  tone: "bg-[#c7e2ff] text-[#0a2a60]", accent: "border-l-[#c7e2ff]" },
  PREPARING:        { label: "Preparing",  tone: "bg-[#ffb780] text-[#5a2300]", accent: "border-l-[#ffb780]" },
  OUT_FOR_DELIVERY: { label: "Out",        tone: "bg-[#e5d2ff] text-[#3a0f80]", accent: "border-l-[#e5d2ff]" },
  DELIVERED:        { label: "Done",       tone: "bg-[#cde6d5] text-[#063722]", accent: "border-l-[#cde6d5]" },
  CANCELLED:        { label: "Cancelled",  tone: "bg-[#ffd4d4] text-[#6b0e0e]", accent: "border-l-[#ffd4d4]" },
}

export function TicketCard({ ticket }: { ticket: KdsTicket }) {
  const meta = statusMeta[ticket.status] ?? statusMeta.PENDING
  const queueLabel = formatTimeInQueue(ticket.createdAt)

  return (
    <article
      className={cn(
        "bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] overflow-hidden border-l-[5px]",
        meta.accent,
      )}
    >
      <header className="flex items-center justify-between px-4 py-3 bg-[#fbf7ee] border-b border-[#f1ede6]">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
              meta.tone,
            )}
          >
            {meta.label}
          </span>
          <span className="font-mono text-[11px] font-semibold text-[#002211]">
            #{ticket.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <span className="text-[10px] text-[#717972] font-medium">{queueLabel}</span>
      </header>

      <section className="px-4 py-3 border-b border-[#f1ede6]">
        <p className="text-sm font-semibold text-[#002211]">{ticket.customerName}</p>
        <ul className="mt-2 space-y-1.5">
          {ticket.items.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-[13px] text-[#1c1c17]">
              <span className="inline-flex min-w-[22px] h-[18px] rounded-md bg-[#033921] text-[#ffdea4] text-[10px] font-bold items-center justify-center">
                {item.quantity}
              </span>
              <span className="flex-1 leading-tight">{item.nameAtOrder}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex items-center justify-between px-4 py-2.5">
        <span className="text-[12px] font-semibold font-mono text-[#002211]">
          ₹{Number(ticket.totalPrice).toFixed(0)}
        </span>
        {!["DELIVERED", "CANCELLED"].includes(ticket.status) && (
          <OrderStatusToggle orderId={ticket.id} initialStatus={ticket.status} />
        )}
      </footer>
    </article>
  )
}
