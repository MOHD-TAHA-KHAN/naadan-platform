import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { InventoryRow } from "@/components/admin/inventory-row"
import { AddItemPanel } from "@/components/admin/add-item-panel"
import { getInventoryStats } from "@/actions/inventory"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Inventory | Naadan Admin" }

export default async function InventoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/")

  const inventoryItems = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" },
  })

  const criticalItems = inventoryItems.filter((i) => i.status === "CRITICAL")
  const lowItems = inventoryItems.filter((i) => i.status === "LOW_STOCK")

  const statsResult = await getInventoryStats()
  const inventoryStats = statsResult.success ? statsResult.data : []

  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin/inventory" staffName={session.user.name} />

      <div className="pl-64 flex-1">
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6">
          <span className="font-semibold text-sm text-[#002211]">Inventory &amp; Raw Stock Management</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-semibold">
              {criticalItems.length} Critical
            </span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-semibold">
              {lowItems.length} Low Stock
            </span>
          </div>
        </header>

        <main className="pt-16 p-6 min-h-screen space-y-6">
          {/* Critical alert */}
          {criticalItems.length > 0 && (
            <div className="bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl p-4 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-[#ba1a1a] text-white shrink-0">
                <span className="material-symbols-outlined text-[18px]">warning</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold tracking-wider uppercase text-[#ba1a1a]">Critical Buffer Alert</p>
                <p className="font-semibold text-sm text-[#1c1c17] mt-0.5">
                  {criticalItems.map((i) => i.name).join(" · ")} — below minimum threshold
                </p>
                <p className="text-xs text-[#414942] mt-0.5">
                  Automated draft purchase orders generated. Authorize via supplier portal.
                </p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-ping mt-1" />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total SKUs", value: inventoryItems.length, sub: `${inventoryItems.filter((i) => i.status === "IN_STOCK").length} in stock` },
              { label: "Critical Items", value: criticalItems.length, sub: "Immediate action needed", alert: true },
              { label: "Low Stock", value: lowItems.length, sub: "Reorder soon" },
              { label: "In Stock", value: inventoryItems.filter((i) => i.status === "IN_STOCK").length, sub: "Adequate supply" },
            ].map(({ label, value, sub, alert }) => (
              <div key={label} className="bg-[#ffffff] rounded-xl p-4 shadow-sm border border-[#f1ede6]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#717972]">{label}</span>
                <p className={`text-2xl font-bold font-mono mt-1 ${alert ? "text-[#ba1a1a]" : "text-[#002211]"}`}>{value}</p>
                <p className="text-[10px] text-[#717972] mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#002211] mb-1" style={{ fontFamily: "Playfair Display, serif" }}>
              Raw Stock Management
            </h1>
            <p className="text-xs text-[#717972]">Live buffer tracking for all primary ingredients and packaging</p>
          </div>

          {/* Add Item Panel */}
          <AddItemPanel />

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryItems.map((item) => (
              <InventoryRow key={item.id} item={item} />
            ))}
          </div>

          {inventoryItems.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-[#c0c9c0] block mb-3">inventory_2</span>
              <h3 className="font-semibold text-[#002211]">No inventory items yet</h3>
              <p className="text-sm text-[#717972] mt-1">
                Add your first inventory item using the panel above
              </p>
            </div>
          )}

          {/* Supplier Intelligence & Usage */}
          {inventoryStats.length > 0 && (
            <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f1ede6]">
                <h2 className="font-bold text-[#002211]">Supplier Intelligence & Usage</h2>
                <p className="text-xs text-[#717972] mt-0.5">Aggregated supplier performance and stock utilization</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#717972] text-xs uppercase tracking-wider bg-[#f7f3eb]">
                      <th className="px-6 py-3 text-left">Supplier Name</th>
                      <th className="px-6 py-3 text-left">Total SKUs Supplied</th>
                      <th className="px-6 py-3 text-left">Critical Items</th>
                      <th className="px-6 py-3 text-left">Low Stock Items</th>
                      <th className="px-6 py-3 text-left">Stock Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1ede6]">
                    {inventoryStats.map((stat) => (
                      <tr key={stat.supplier} className="hover:bg-[#f7f3eb] transition-colors">
                        <td className="px-6 py-3 font-semibold text-[#002211]">{stat.supplier}</td>
                        <td className="px-6 py-3 text-[#1c1c17]">{stat.totalSkus}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stat.criticalItems > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                            {stat.criticalItems}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stat.lowStockItems > 0 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                            {stat.lowStockItems}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#f1ede6] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${parseFloat(stat.utilization) < 50 ? "bg-red-500" : parseFloat(stat.utilization) < 80 ? "bg-yellow-500" : "bg-green-500"}`}
                                style={{ width: `${Math.min(parseFloat(stat.utilization), 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-[#002211]">{stat.utilization}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}