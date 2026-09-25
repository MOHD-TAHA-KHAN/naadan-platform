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

  const res = await fetch("http://127.0.0.1:3001/api/kds/orders", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load KDS orders from backend")
  
  const { activeTickets, pastTickets } = (await res.json()) as {
    activeTickets: KdsTicket[]
    pastTickets: KdsTicket[]
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
