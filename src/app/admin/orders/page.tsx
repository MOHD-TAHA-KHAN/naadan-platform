import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { OrderStatusSelect } from "@/components/admin/order-status-select"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Orders & KDS | Naadan Admin" }

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
  PREPARING: "bg-orange-100 text-orange-800 border-orange-300",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800 border-purple-300",
  DELIVERED: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
}

export default async function AdminOrdersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/menu")

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  })

  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status))
  const pastOrders = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status))

  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin/orders" staffName={session.user.name} />

      <div className="pl-64 flex-1">
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#002211]">Live KDS Dispatch Feed</span>
            <span className="px-2 py-0.5 rounded-full bg-[#fcca66] text-[#755400] text-[10px] font-semibold">NAGPUR CENTRAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38684c] animate-pulse" />
            <span className="text-xs text-[#717972]">{activeOrders.length} active orders</span>
          </div>
        </header>

        <main className="pt-16 p-6 min-h-screen">
          <div className="mb-6 bg-[#f7f3eb] px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
                Order History &amp; Kitchen Display
              </h1>
              <p className="text-xs text-[#717972] mt-0.5">Update order status to push real-time notifications to customers</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#414942]">
              <span className="material-symbols-outlined text-[16px] text-[#38684c]">timelapse</span>
              <span>Avg. Ticket: <strong>17.4 mins</strong></span>
            </div>
          </div>

          {/* Active orders KDS */}
          {activeOrders.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7b5900] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7b5900] animate-pulse" />
                Active / In-Progress ({activeOrders.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-[#ffffff] rounded-xl p-4 shadow-sm border-l-4 ${
                      order.status === "PENDING" ? "border-l-yellow-400" :
                      order.status === "CONFIRMED" ? "border-l-blue-400" :
                      order.status === "PREPARING" ? "border-l-orange-400" :
                      "border-l-purple-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-[#002211]">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#1c1c17]">{order.user.name}</p>
                    <div className="text-xs text-[#717972] mt-1 space-y-0.5">
                      {order.items.map((i) => (
                        <p key={i.id}>• {i.nameAtOrder} × {i.quantity}</p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f1ede6]">
                      <span className="font-bold text-[#002211]">₹{Number(order.totalPrice).toFixed(0)}</span>
                      <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past orders */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#717972] mb-3">
              Completed &amp; Cancelled ({pastOrders.length})
            </h2>
            {pastOrders.length === 0 ? (
              <div className="bg-[#ffffff] rounded-xl p-8 text-center text-[#717972] border border-[#f1ede6]">
                <span className="material-symbols-outlined text-[40px] text-[#c0c9c0] block mb-2">receipt_long</span>
                No completed orders yet.
              </div>
            ) : (
              <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#717972] text-xs uppercase tracking-wider bg-[#f7f3eb]">
                      <th className="px-5 py-3 text-left">Order</th>
                      <th className="px-5 py-3 text-left">Customer</th>
                      <th className="px-5 py-3 text-left">Total</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Time</th>
                      <th className="px-5 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1ede6]">
                    {pastOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#f7f3eb] transition-colors">
                        <td className="px-5 py-3 font-mono font-semibold text-[#002211]">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="px-5 py-3 text-[#1c1c17]">{order.user.name}</td>
                        <td className="px-5 py-3 font-semibold text-[#002211]">₹{Number(order.totalPrice).toFixed(0)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[order.status]}`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#717972] text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}{" "}
                          {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-5 py-3">
                          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
