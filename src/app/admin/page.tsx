import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin Dashboard | Naadan" }

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/menu")

  const [totalUsers, totalOrders, totalMenuItems, pendingOrders, recentOrders] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.menuItem.count({ where: { available: true } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, items: true },
    }),
  ])

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayRevenue = await prisma.order.aggregate({
    where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
    _sum: { totalPrice: true },
  })

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }

  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin" staffName={session.user.name} />

      <div className="pl-64 flex-1">
        {/* Top header */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#f1ede6] px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#38684c] animate-pulse" />
              <span className="text-xs font-semibold text-[#1c1c17]">Nagpur Central Kitchen • ONLINE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#033921] text-white flex items-center justify-center font-bold text-xs">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col leading-none">
              <span className="text-xs font-semibold text-[#1c1c17]">{session.user.name}</span>
              <span className="text-[10px] text-[#717972]">Admin • Nagpur</span>
            </div>
          </div>
        </header>

        <main className="pt-16 p-6 min-h-screen">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#033921] text-[#ffdea4] text-[10px] font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fcca66] animate-ping" />
                Live KDS Stream
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
              Kitchen Operations Dashboard
            </h1>
            <p className="text-sm text-[#717972] mt-0.5">
              Nagpur Cloud Kitchen #01 — Dharampeth Hub
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Today's Revenue", value: `₹${Number(todayRevenue._sum.totalPrice ?? 0).toFixed(0)}`, icon: "payments", color: "text-[#38684c]" },
              { label: "Pending / Active Orders", value: String(pendingOrders), icon: "skillet", color: "text-[#7b5900]" },
              { label: "Total Orders", value: String(totalOrders), icon: "receipt_long", color: "text-[#002211]" },
              { label: "Menu Items Live", value: String(totalMenuItems), icon: "restaurant_menu", color: "text-[#38684c]" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-[#ffffff] rounded-xl p-4 shadow-sm border border-[#f1ede6]">
                <div className="flex items-center justify-between text-[#717972] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
                  <span className={`material-symbols-outlined text-[18px] ${color}`}>{icon}</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[#002211]">{value}</p>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#f1ede6] flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#002211]">Recent Orders</h2>
                <p className="text-xs text-[#717972] mt-0.5">Latest {recentOrders.length} orders across all statuses</p>
              </div>
              <a href="/admin/orders" className="text-xs font-semibold text-[#7b5900] hover:underline flex items-center gap-1">
                View all <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-12 text-center text-[#717972]">
                <span className="material-symbols-outlined text-[48px] text-[#c0c9c0] block mb-3">receipt_long</span>
                <p className="font-semibold text-[#002211]">No orders yet</p>
                <p className="text-sm mt-1">Customer orders will appear here in real-time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#717972] text-xs uppercase tracking-wider bg-[#f7f3eb]">
                      <th className="px-6 py-3 text-left">Order ID</th>
                      <th className="px-6 py-3 text-left">Customer</th>
                      <th className="px-6 py-3 text-left">Items</th>
                      <th className="px-6 py-3 text-left">Total</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1ede6]">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#f7f3eb] transition-colors">
                        <td className="px-6 py-3 font-mono font-semibold text-[#002211]">
                          #{order.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-3 text-[#1c1c17]">{order.user.name}</td>
                        <td className="px-6 py-3 text-[#717972]">{order.items.length} item(s)</td>
                        <td className="px-6 py-3 font-semibold text-[#002211]">
                          ₹{Number(order.totalPrice).toFixed(0)}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[#717972] text-xs">
                          {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
