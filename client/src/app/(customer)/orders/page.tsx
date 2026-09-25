import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CustomerHeader } from "@/components/customer/customer-header"
import { CustomerFooter } from "@/components/customer/footer"
import { OrderList } from "@/components/customer/order-list"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Order History | Naadan" }

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: true,
      review: true,
    },
    orderBy: { createdAt: "desc" },
  })

  // Convert Decimal objects to plain numbers for Client Component serialization
  const serializedOrders = orders.map((order) => ({
    ...order,
    totalPrice: Number(order.totalPrice),
    items: order.items.map((item) => ({
      ...item,
      priceAtOrder: Number(item.priceAtOrder),
    })),
  }))

  return (
    <div className="min-h-screen bg-[#fdf9f1]">
      <CustomerHeader
        cartCount={0}
        activePage="orders"
        userName={session.user.name}
      />

      <main className="w-full pt-[calc(4rem+2.5rem)] md:pt-[calc(4rem+2.5rem+1.5rem)] px-4 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-[#717972] mb-6">
            <a href="/menu" className="hover:text-[#002211]">Menu</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#002211] font-semibold">Order History</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
              My Orders
            </h1>
            <p className="text-[#717972] text-sm mt-1">
              View your past orders and leave reviews
            </p>
          </div>

          <OrderList orders={serializedOrders} />
        </div>
      </main>
      <CustomerFooter />
    </div>
  )
}
