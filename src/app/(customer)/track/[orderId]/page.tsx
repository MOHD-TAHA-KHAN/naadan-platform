import { auth } from "../../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CustomerHeader } from "@/components/customer/customer-header"
import { TrackPoller } from "@/components/customer/track-poller"
import { getStatusLabel } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Live Order Tracking | Naadan" }

const TERMINAL = new Set(["DELIVERED", "CANCELLED"])

const STATUS_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const

const STEP_ICONS: Record<string, string> = {
  PENDING: "hourglass_empty",
  CONFIRMED: "check_circle",
  PREPARING: "outdoor_grill",
  OUT_FOR_DELIVERY: "electric_moped",
  DELIVERED: "home",
}

const STEP_LABELS: Record<string, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Kitchen Preparing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
}

const BANNER_MESSAGE: Record<string, string> = {
  PENDING: "Order received — confirming with kitchen now...",
  CONFIRMED: "Confirmed! Your claypot is being prepared.",
  PREPARING: "Kitchen is crafting your order in earthen pots...",
  OUT_FOR_DELIVERY: "Your rider is on the way!",
  DELIVERED: "Your feast has arrived! 🎉",
  CANCELLED: "This order was cancelled.",
}

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { orderId } = await params

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order || order.userId !== session.user.id) notFound()

  const cartCount = await prisma.cartItem.count({
    where: { userId: session.user.id },
  })

  const isTerminal = TERMINAL.has(order.status)
  const currentStepIdx = STATUS_STEPS.indexOf(
    order.status as (typeof STATUS_STEPS)[number]
  )

  return (
    <div className="min-h-screen bg-[#fdf9f1]">
      {/* Invisible polling island — passes current status so it can self-stop */}
      <TrackPoller status={order.status} />

      <CustomerHeader cartCount={cartCount} userName={session.user.name} />

      <main className="w-full pt-[calc(4rem+2.5rem)] md:pt-[calc(4rem+2.5rem+1.5rem)] px-4 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          {/* ── Order header card ──────────────────────────────────────────── */}
          <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#033921] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px] text-[#ffdea4]">
                  outdoor_grill
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#7b5900] uppercase tracking-wider">
                    Live Kitchen Tracker
                  </span>
                  <span className="font-bold text-sm text-[#002211]">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                  {/* Live / terminal badge */}
                  {isTerminal ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f1ede6] text-[#717972] text-[10px] font-semibold">
                      <span className="material-symbols-outlined text-[11px]">
                        check_circle
                      </span>
                      {order.status === "CANCELLED" ? "Cancelled" : "Completed"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#033921] text-[#ffdea4] text-[10px] font-semibold">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fcca66] opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#fcca66]" />
                      </span>
                      Live
                    </span>
                  )}
                </div>
                {order.address && (
                  <p className="text-xs text-[#717972] mt-0.5">
                    Delivering to:{" "}
                    <span className="text-[#1c1c17] font-medium">
                      {order.address}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Status pill */}
            <div className="bg-[#f7f3eb] px-4 py-3 rounded-xl text-right shrink-0">
              <p className="text-[10px] text-[#717972] uppercase tracking-wider">
                Status
              </p>
              <p className="font-bold text-[#002211] mt-0.5">
                {getStatusLabel(order.status)}
              </p>
              <p className="text-[10px] text-[#717972] mt-0.5">
                {isTerminal
                  ? "No further updates"
                  : "Refreshes every 6 s"}
              </p>
            </div>
          </div>

          {/* ── Live banner ────────────────────────────────────────────────── */}
          <div
            className={`rounded-2xl p-6 shadow-md relative overflow-hidden ${
              order.status === "DELIVERED"
                ? "bg-[#baefcb]"
                : order.status === "CANCELLED"
                ? "bg-[#ffdad6]"
                : "bg-[#033921]"
            }`}
          >
            {/* Decorative icon watermark */}
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[180px]">
                {order.status === "DELIVERED"
                  ? "celebration"
                  : order.status === "CANCELLED"
                  ? "cancel"
                  : "local_fire_department"}
              </span>
            </div>

            <div className="relative z-10">
              {/* Status chip */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 ${
                  order.status === "DELIVERED"
                    ? "bg-[#002211]/10"
                    : order.status === "CANCELLED"
                    ? "bg-[#93000a]/10"
                    : "bg-[#002211]"
                }`}
              >
                {!isTerminal && (
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fcca66] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#fcca66]" />
                  </span>
                )}
                <span
                  className={`material-symbols-outlined text-[14px] ${
                    order.status === "DELIVERED"
                      ? "text-[#002211]"
                      : order.status === "CANCELLED"
                      ? "text-[#93000a]"
                      : "text-[#ffdea4]"
                  }`}
                >
                  {STEP_ICONS[order.status] ?? "skillet"}
                </span>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    order.status === "DELIVERED"
                      ? "text-[#002211]"
                      : order.status === "CANCELLED"
                      ? "text-[#93000a]"
                      : "text-[#ffdea4]"
                  }`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <h2
                className={`text-2xl font-bold ${
                  order.status === "DELIVERED" || order.status === "CANCELLED"
                    ? "text-[#002211]"
                    : "text-white"
                }`}
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {BANNER_MESSAGE[order.status] ?? "Tracking your order..."}
              </h2>

              <p
                className={`text-sm mt-1 ${
                  order.status === "DELIVERED"
                    ? "text-[#1f5036]"
                    : order.status === "CANCELLED"
                    ? "text-[#93000a]"
                    : "text-[#baefcb]"
                }`}
              >
                Order #{order.id.slice(-6).toUpperCase()} · Placed at{" "}
                {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                IST
              </p>
            </div>
          </div>

          {/* ── Progress stepper ───────────────────────────────────────────── */}
          {order.status !== "CANCELLED" && (
            <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6">
              <h3
                className="font-bold text-[#002211] mb-6"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Order Progress
              </h3>
              <div className="flex items-start">
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx <= currentStepIdx
                  const active = idx === currentStepIdx
                  const isLast = idx === STATUS_STEPS.length - 1
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className="flex items-center w-full">
                        {/* Left connector */}
                        <div
                          className="flex-1 h-0.5"
                          style={{ visibility: idx === 0 ? "hidden" : "visible" }}
                        >
                          <div
                            className={`h-full transition-colors duration-700 ${
                              done && idx > 0 ? "bg-[#033921]" : "bg-[#e6e2da]"
                            }`}
                          />
                        </div>

                        {/* Step node */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
                            active
                              ? "bg-[#fcca66] text-[#755400] ring-4 ring-[#fcca66]/30"
                              : done
                              ? "bg-[#033921] text-white"
                              : "bg-[#e6e2da] text-[#c0c9c0]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {STEP_ICONS[step]}
                          </span>
                        </div>

                        {/* Right connector */}
                        <div
                          className="flex-1 h-0.5"
                          style={{ visibility: isLast ? "hidden" : "visible" }}
                        >
                          <div
                            className={`h-full transition-colors duration-700 ${
                              idx < currentStepIdx ? "bg-[#033921]" : "bg-[#e6e2da]"
                            }`}
                          />
                        </div>
                      </div>

                      <p
                        className={`text-[10px] font-semibold mt-2 text-center transition-colors duration-500 ${
                          active
                            ? "text-[#7b5900]"
                            : done
                            ? "text-[#002211]"
                            : "text-[#c0c9c0]"
                        }`}
                      >
                        {STEP_LABELS[step]}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Order items ────────────────────────────────────────────────── */}
          <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6">
            <h3
              className="font-bold text-[#002211] mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Your Order
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm py-2 border-b border-[#f1ede6] last:border-0"
                >
                  <div>
                    <p className="font-medium text-[#002211]">{item.nameAtOrder}</p>
                    <p className="text-xs text-[#717972]">× {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-[#002211]">
                    ₹{(Number(item.priceAtOrder) * item.quantity).toFixed(0)}
                  </p>
                </div>
              ))}
              <div className="flex justify-between font-bold text-[#002211] pt-2">
                <span>Total</span>
                <span>₹{Number(order.totalPrice).toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* ── Footer links ───────────────────────────────────────────────── */}
          <a
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#7b5900] hover:underline self-start"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Order more from our menu
          </a>
        </div>
      </main>
    </div>
  )
}
