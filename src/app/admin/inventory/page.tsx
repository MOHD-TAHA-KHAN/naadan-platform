import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Inventory | Naadan Admin" }

// Static inventory data — in a real build this would be a DB model
const inventoryItems = [
  { id: "1", name: "Kaima Short-grain Biryani Rice", unit: "kg", current: 15.4, buffer: 45, status: "CRITICAL", supplier: "Wayanad Farmers Collective" },
  { id: "2", name: "Cold-Pressed Coconut Oil", unit: "litres", current: 28.0, buffer: 20, status: "IN_STOCK", supplier: "Kozhikode Growers" },
  { id: "3", name: "Whole Black Pepper (Kurumali)", unit: "kg", current: 3.2, buffer: 5, status: "LOW_STOCK", supplier: "Idukki Spice Co." },
  { id: "4", name: "Kudampuli (Gambooge / Cocum)", unit: "kg", current: 8.6, buffer: 3, status: "IN_STOCK", supplier: "Alappuzha Coastal Supply" },
  { id: "5", name: "Shallots (Chuvannulli)", unit: "kg", current: 42.0, buffer: 15, status: "IN_STOCK", supplier: "Nagpur Central Mandi" },
  { id: "6", name: "Fresh Curry Leaves", unit: "bunches", current: 12, buffer: 10, status: "IN_STOCK", supplier: "Local Farm" },
  { id: "7", name: "Unglazed Terracotta Pots (Delivery)", unit: "pieces", current: 85, buffer: 50, status: "IN_STOCK", supplier: "Thrissur Potter Collective" },
  { id: "8", name: "Banana Leaf Sheets", unit: "sheets", current: 4, buffer: 30, status: "CRITICAL", supplier: "Local Kerala Supplier" },
  { id: "9", name: "Cardamom (Whole)", unit: "kg", current: 0.8, buffer: 1, status: "LOW_STOCK", supplier: "Idukki Spice Co." },
  { id: "10", name: "Mutton (Goat, Fresh)", unit: "kg", current: 22.5, buffer: 10, status: "IN_STOCK", supplier: "Nagpur Meat Market" },
]

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  IN_STOCK: { label: "In Stock", bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  LOW_STOCK: { label: "Low Stock", bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-300" },
  CRITICAL: { label: "Critical", bg: "bg-red-50", text: "text-red-800", border: "border-red-300" },
  OUT_OF_STOCK: { label: "Out of Stock", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
}

export default async function InventoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/menu")

  const criticalItems = inventoryItems.filter((i) => i.status === "CRITICAL")
  const lowItems = inventoryItems.filter((i) => i.status === "LOW_STOCK")

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

          {/* Inventory table */}
          <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#717972] text-xs uppercase tracking-wider bg-[#f7f3eb]">
                  <th className="px-5 py-3 text-left">Ingredient / Item</th>
                  <th className="px-5 py-3 text-left">Current Stock</th>
                  <th className="px-5 py-3 text-left">Buffer</th>
                  <th className="px-5 py-3 text-left">Fill Level</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ede6]">
                {inventoryItems.map((item) => {
                  const pct = Math.min(100, Math.round((item.current / (item.buffer * 2)) * 100))
                  const cfg = statusConfig[item.status]
                  return (
                    <tr key={item.id} className="hover:bg-[#f7f3eb] transition-colors">
                      <td className="px-5 py-3 font-medium text-[#002211]">{item.name}</td>
                      <td className="px-5 py-3 font-mono font-semibold text-[#1c1c17]">
                        {item.current} {item.unit}
                      </td>
                      <td className="px-5 py-3 text-[#717972] text-xs">
                        Min: {item.buffer} {item.unit}
                      </td>
                      <td className="px-5 py-3 w-32">
                        <div className="h-2 rounded-full bg-[#f1ede6] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === "CRITICAL" ? "bg-[#ba1a1a]" :
                              item.status === "LOW_STOCK" ? "bg-[#7b5900]" :
                              "bg-[#38684c]"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#717972] text-xs">{item.supplier}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[#c0c9c0] text-center">
            Inventory module uses static data. Connect to your DB model to enable live tracking.
          </p>
        </main>
      </div>
    </div>
  )
}
