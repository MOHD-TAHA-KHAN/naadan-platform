import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { OrderStatusSelect } from "@/components/admin/order-status-select"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Delivery Tracking | Naadan Admin" }

export default async function DeliveryTrackingPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/")

  const outForDelivery = await prisma.order.findMany({
    where: { status: "OUT_FOR_DELIVERY" },
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { nameAtOrder: true, quantity: true } },
    },
    orderBy: { updatedAt: "asc" },
  })

  const recentDelivered = await prisma.order.findMany({
    where: { status: "DELIVERED" },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: { user: { select: { name: true } } },
  })

  const totalActive = await prisma.order.count({
    where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] } },
  })

  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin/delivery" staffName={session.user.name} />

      <div className="pl-64 flex-1">
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38684c] animate-ping" />
            <span className="font-bold text-sm text-[#002211]">{totalActive} Active Orders</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#717972]">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#38684c]">verified</span>
              On-Time SLA: 94.2%
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#7b5900]">timelapse</span>
              Avg Transit: 19.4 mins
            </div>
          </div>
        </header>

        <main className="pt-16 p-6 min-h-screen space-y-6">
          {/* Fleet pulse banner */}
          <div className="bg-[#033921] text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: "Live Fleet Orders", value: String(outForDelivery.length), icon: "electric_moped" },
                { label: "On-Time SLA", value: "94.2%", icon: "verified" },
                { label: "Avg Transit", value: "19.4 mins", icon: "timelapse" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center gap-2 bg-[#002211] px-3 py-2 rounded-lg">
                  <span className="material-symbols-outlined text-[18px] text-[#fcca66]">{icon}</span>
                  <div>
                    <p className="text-[10px] text-[#baefcb] uppercase">{label}</p>
                    <p className="font-bold text-white text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#baefcb]">
              <span className="w-2 h-2 rounded-full bg-[#38684c]" />
              Telemetry Sync: Live
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#002211] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
              Live Delivery Fleet Dispatch
            </h1>
            <p className="text-xs text-[#717972]">Orders currently out for delivery — mark as Delivered when confirmed</p>
          </div>

          {/* Active deliveries */}
          {outForDelivery.length === 0 ? (
            <div className="bg-[#ffffff] rounded-xl border border-[#f1ede6] p-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#c0c9c0] block mb-3">electric_moped</span>
              <p className="font-semibold text-[#002211]">No active deliveries</p>
              <p className="text-sm text-[#717972] mt-1">Orders dispatched will appear here for tracking.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {outForDelivery.map((order) => (
                <div key={order.id} className="bg-[#ffffff] rounded-xl p-5 shadow-sm border border-[#f1ede6] border-l-4 border-l-purple-400">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      <span className="font-mono font-bold text-[#002211]">#{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-semibold">
                      OUT FOR DELIVERY
                    </span>
                  </div>
                  <p className="font-medium text-sm text-[#1c1c17] mb-1">{order.user.name}</p>
                  {order.address && (
                    <p className="text-xs text-[#717972] mb-2 flex items-start gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#7b5900] shrink-0 mt-0.5">location_on</span>
                      {order.address}
                    </p>
                  )}
                  <div className="text-xs text-[#717972] space-y-0.5 mb-3">
                    {order.items.map((i, idx) => (
                      <p key={idx}>• {i.nameAtOrder} × {i.quantity}</p>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#f1ede6]">
                    <span className="font-bold text-[#002211]">₹{Number(order.totalPrice).toFixed(0)}</span>
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recently delivered */}
          {recentDelivered.length > 0 && (
            <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f1ede6] bg-[#f7f3eb]">
                <h2 className="font-semibold text-sm text-[#002211]">Recently Delivered (Last 10)</h2>
              </div>
              <div className="divide-y divide-[#f1ede6]">
                {recentDelivered.map((order) => (
                  <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[16px] text-[#38684c]">check_circle</span>
                      <div>
                        <p className="font-mono text-xs font-semibold text-[#002211]">#{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-[#717972]">{order.user.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-[#002211]">₹{Number(order.totalPrice).toFixed(0)}</p>
                      <p className="text-[10px] text-[#717972]">
                        {new Date(order.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
