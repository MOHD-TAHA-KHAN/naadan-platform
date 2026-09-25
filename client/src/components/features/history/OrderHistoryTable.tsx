import type { OrderStatus } from "../kds/types"

export interface OrderHistoryTableProps {
  tickets: Array<{
    id: string
    status: OrderStatus
    createdAt: string
    totalPrice: number
    customerName: string
    items: Array<{ id: string; nameAtOrder: string; quantity: number }>
  }>
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

export function OrderHistoryTable({ tickets }: OrderHistoryTableProps) {
  return (
    <section className="mt-8 bg-[#ffffff] rounded-xl border border-[#f1ede6] shadow-sm overflow-hidden">
      <header className="px-6 py-4 border-b border-[#f1ede6] flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#002211]">Recent History</h2>
          <p className="text-xs text-[#717972] mt-0.5">Delivered & cancelled tickets</p>
        </div>
      </header>

      {tickets.length === 0 ? (
        <div className="p-12 text-center text-[#717972]">
          <span className="material-symbols-outlined text-[48px] text-[#c0c9c0] block mb-3">receipt_long</span>
          <p className="font-semibold text-[#002211]">No past tickets yet</p>
          <p className="text-sm mt-1">Completed & cancelled orders will appear here.</p>
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
                <th className="px-6 py-3 text-left">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1ede6]">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-[#f7f3eb] transition-colors">
                  <td className="px-6 py-3 font-mono font-semibold text-[#002211]">
                    #{t.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-3 text-[#1c1c17]">{t.customerName}</td>
                  <td className="px-6 py-3 text-[#717972]">{t.items.length} item(s)</td>
                  <td className="px-6 py-3 font-semibold text-[#002211]">
                    ₹{Number(t.totalPrice).toFixed(0)}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[#717972] text-xs">
                    {new Date(t.createdAt).toLocaleString("en-IN", {
                      hour: "2-digit", minute: "2-digit",
                      day: "2-digit", month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
