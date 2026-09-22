import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Analytics | Naadan Admin" }

export default async function AdminAnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/")

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7)

  const [
    totalRevenue,
    todayRevenue,
    weekRevenue,
    totalOrders,
    todayOrders,
    deliveredOrders,
    cancelledOrders,
    totalUsers,
    topItems,
    ordersByStatus,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { totalPrice: true } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" }, createdAt: { gte: todayStart } }, _sum: { totalPrice: true } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" }, createdAt: { gte: weekStart } }, _sum: { totalPrice: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.orderItem.groupBy({
      by: ["menuItemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
  ])

  // Fetch top item names in a single query
  const menuItemIds = topItems.map(item => item.menuItemId)
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, name: true },
  })
  
  const menuItemMap = new Map(menuItems.map(mi => [mi.id, mi.name]))
  
  const topItemsWithNames = topItems.map(item => ({
    name: menuItemMap.get(item.menuItemId) ?? "Unknown",
    quantity: item._sum.quantity ?? 0
  }))

  const maxQty = Math.max(...topItemsWithNames.map((i) => i.quantity), 1)

  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin/analytics" staffName={session.user.name} />

      <div className="pl-64 flex-1">
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#033921] text-[#ffdea4] text-[10px] font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fcca66] animate-ping" />
              Live KDS Stream
            </span>
            <span className="font-semibold text-sm text-[#002211]">Kitchen Operations &amp; Daily Analytics</span>
          </div>
        </header>

        <main className="pt-16 p-6 min-h-screen space-y-6">
          <div className="bg-[#f7f3eb] px-4 py-3 rounded-xl flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
                Operations &amp; Revenue Analytics
              </h1>
              <p className="text-xs text-[#717972]">Nagpur Cloud Kitchen #01 — Dharampeth Hub</p>
            </div>
          </div>

          {/* Revenue cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: `₹${Number(totalRevenue._sum.totalPrice ?? 0).toFixed(0)}`, icon: "payments", sub: "All time" },
              { label: "Today's Revenue", value: `₹${Number(todayRevenue._sum.totalPrice ?? 0).toFixed(0)}`, icon: "today", sub: "Since midnight" },
              { label: "This Week", value: `₹${Number(weekRevenue._sum.totalPrice ?? 0).toFixed(0)}`, icon: "calendar_view_week", sub: "Last 7 days" },
              { label: "Total Customers", value: String(totalUsers), icon: "group", sub: "Registered users" },
            ].map(({ label, value, icon, sub }) => (
              <div key={label} className="bg-[#ffffff] rounded-xl p-4 shadow-sm border border-[#f1ede6]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#717972]">{label}</span>
                  <span className="material-symbols-outlined text-[18px] text-[#38684c]">{icon}</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[#002211]">{value}</p>
                <p className="text-[10px] text-[#717972] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Order stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: totalOrders, color: "text-[#002211]" },
              { label: "Today's Orders", value: todayOrders, color: "text-[#7b5900]" },
              { label: "Delivered", value: deliveredOrders, color: "text-[#38684c]" },
              { label: "Cancelled", value: cancelledOrders, color: "text-[#ba1a1a]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#ffffff] rounded-xl p-4 shadow-sm border border-[#f1ede6] text-center">
                <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
                <p className="text-xs font-semibold text-[#717972] mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top selling items */}
            <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] p-5">
              <h3 className="font-bold text-[#002211] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
                Top Selling Dishes
              </h3>
              {topItemsWithNames.length === 0 ? (
                <p className="text-sm text-[#717972] text-center py-6">No order data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topItemsWithNames.map((item, idx) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#1c1c17] font-medium flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#f7f3eb] text-[#7b5900] text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {item.name}
                        </span>
                        <span className="font-semibold text-[#002211]">{item.quantity} sold</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#f1ede6] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#fcca66]"
                          style={{ width: `${(item.quantity / maxQty) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order status distribution */}
            <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] p-5">
              <h3 className="font-bold text-[#002211] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
                Orders by Status
              </h3>
              {ordersByStatus.length === 0 ? (
                <p className="text-sm text-[#717972] text-center py-6">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {ordersByStatus.map((s) => {
                    const pct = totalOrders > 0 ? Math.round((s._count.status / totalOrders) * 100) : 0
                    const colorMap: Record<string, string> = {
                      PENDING: "#fbbf24", CONFIRMED: "#60a5fa", PREPARING: "#fb923c",
                      OUT_FOR_DELIVERY: "#c084fc", DELIVERED: "#4ade80", CANCELLED: "#f87171",
                    }
                    return (
                      <div key={s.status}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-[#414942]">{s.status.replace(/_/g, " ")}</span>
                          <span className="font-semibold text-[#002211]">{s._count.status} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#f1ede6] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: colorMap[s.status] ?? "#c0c9c0" }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
