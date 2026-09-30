import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { KdsHeader } from "@/components/admin/KdsHeader"
import { KdsBoardIntro } from "@/components/admin/KdsBoardIntro"
import { OrderQueue } from "@/components/admin/OrderQueue"
import type { KdsTicket } from "@server" 
import dynamic from "next/dynamic"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Orders & KDS | Naadan Admin" }

const OrderHistoryTable = dynamic(
  () => import("@/components/admin/OrderHistoryTable").then((m) => m.OrderHistoryTable),
)

export default async function AdminOrdersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/")

  let activeTickets: KdsTicket[] = []
  let pastTickets: KdsTicket[] = []

  try {
    const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"
    const res = await fetch(`${backendUrl}/api/orders?active=true`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const data = (await res.json()) as {
        orders?: KdsTicket[]
        activeTickets?: KdsTicket[]
        pastTickets?: KdsTicket[]
      }
      activeTickets = data.orders || data.activeTickets || []
      pastTickets = data.pastTickets || []
    }
  } catch (err) {
    console.error("[admin/orders] Failed to load KDS orders from backend:", err)
    activeTickets = []
    pastTickets = []
  }

  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin/orders" staffName={session.user.name} />
      <div className="pl-64 flex-1">
        <KdsHeader activeCount={activeTickets.length} />
        <main className="pt-16 p-6 min-h-screen">
          <KdsBoardIntro />
          <OrderQueue tickets={activeTickets} />
          <OrderHistoryTable tickets={pastTickets} />
        </main>
      </div>
    </div>
  )
}
