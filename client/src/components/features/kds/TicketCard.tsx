"use client"

import { cn } from "@/components/ui"
import { OrderStatusToggle } from "./OrderStatusToggle"
import { formatTimeInQueue } from "@/utils"
import type { KdsTicket, OrderStatus } from "./types"

const statusMeta: Record<OrderStatus, { label: string; tone: string; accent: string }> = {
  PENDING:          { label: "Order Received", tone: "bg-[#fcca66]/30 text-[#755400]", accent: "border-l-[#fcca66]" },
  CONFIRMED:        { label: "Confirmed",      tone: "bg-[#c7e2ff]/35 text-[#0a2a60]", accent: "border-l-[#c7e2ff]" },
  PREPARING:        { label: "Cooking",        tone: "bg-[#ffb780]/30 text-[#5a2300]", accent: "border-l-[#ffb780]" },
  OUT_FOR_DELIVERY: { label: "Out",            tone: "bg-[#e5d2ff]/35 text-[#3a0f80]", accent: "border-l-[#e5d2ff]" },
  DELIVERED:        { label: "Delivered",      tone: "bg-[#cde6d5] text-[#063722]", accent: "border-l-[#cde6d5]" },
  CANCELLED:        { label: "Cancelled",      tone: "bg-[#ffd4d4] text-[#6b0e0e]", accent: "border-l-[#ffd4d4]" },
}

export function TicketCard({
  ticket,
  onStatusUpdated,
}: {
  ticket: KdsTicket
  onStatusUpdated?: (orderId: string, newStatus: OrderStatus) => void
}) {
  const meta = statusMeta[ticket.status] ?? statusMeta.PENDING
  const queueLabel = formatTimeInQueue(ticket.createdAt)

  let cleanAddress = ticket.deliveryAddress || ticket.address || ""
  let cleanPhone = ticket.customerPhone || ""

  try {
    if (cleanAddress.startsWith("{")) {
      const parsed = JSON.parse(cleanAddress)
      cleanAddress = parsed?.drop?.address || parsed?.address || cleanAddress
      if (!cleanPhone && parsed?.drop?.phone) {
        cleanPhone = parsed.drop.phone
      }
    }
  } catch {
    // keep as is
  }

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
          <span className="font-mono text-[12px] font-bold text-[#002211]">
            #{ticket.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <span className="text-[10px] text-[#717972] font-medium">{queueLabel}</span>
      </header>

      <section className="px-4 py-3 border-b border-[#f1ede6] space-y-2">
        <p className="text-sm font-bold text-[#002211]">{ticket.customerName}</p>

        {/* Item list with quantities */}
        <ul className="space-y-1.5 pt-1">
          {ticket.items.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-[13px] text-[#1c1c17]">
              <span className="inline-flex min-w-[24px] h-[19px] rounded-md bg-[#033921] text-[#ffdea4] text-[11px] font-bold items-center justify-center shrink-0">
                {item.quantity}x
              </span>
              <span className="flex-1 leading-tight font-medium">{item.nameAtOrder}</span>
            </li>
          ))}
        </ul>

        {/* Clean delivery address & customer phone */}
        {cleanAddress && (
          <div className="pt-2 border-t border-[#f1ede6] flex items-start gap-1.5 text-xs text-[#525a53]">
            <span className="material-symbols-outlined text-[15px] text-[#033921] shrink-0 mt-0.5">
              pin_drop
            </span>
            <span className="line-clamp-2 leading-tight font-normal">{cleanAddress}</span>
          </div>
        )}

        {cleanPhone && (
          <div className="flex items-center gap-1.5 text-xs text-[#525a53]">
            <span className="material-symbols-outlined text-[15px] text-[#033921] shrink-0">
              call
            </span>
            <a href={`tel:${cleanPhone}`} className="hover:underline font-medium text-[#002211]">
              {cleanPhone}
            </a>
          </div>
        )}
      </section>

      <footer className="flex items-center justify-between px-4 py-2.5 bg-[#faf8f4]/60">
        <span className="text-[12px] font-semibold font-mono text-[#002211]">
          ₹{Number(ticket.totalPrice).toFixed(0)}
        </span>
        {!["DELIVERED", "CANCELLED"].includes(ticket.status) && (
          <OrderStatusToggle
            orderId={ticket.id}
            initialStatus={ticket.status}
            onStatusUpdated={onStatusUpdated}
          />
        )}
      </footer>
    </article>
  )
}

