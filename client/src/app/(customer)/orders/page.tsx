import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CustomerHeader } from "@/components/customer/customer-header"
import { CustomerFooter } from "@/components/customer/footer"
import { OrderHistory } from "@/components/customer/OrderHistory"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Order History | Naadan" }

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          menuItem: {
            select: { imageUrl: true },
          },
        },
      },
      review: true,
    },
    orderBy: { createdAt: "desc" },
  })

  // Format orders cleanly for the Client Component
  const formattedOrders = orders.map((order) => {
    let cleanAddress = order.address || ""
    let cleanPhone = ""
    let distanceKm: string | undefined

    try {
      if (order.address?.startsWith("{")) {
        const parsed = JSON.parse(order.address)
        cleanAddress = parsed?.drop?.address || order.address
        cleanPhone = parsed?.drop?.phone || ""
        distanceKm = parsed?.distanceKm
      }
    } catch {
      // keep as is
    }

    return {
      id: order.id,
      orderNumber: order.id.slice(-6).toUpperCase(),
      totalPrice: Number(order.totalPrice),
      deliveryFee: Number(order.deliveryFee ?? 40),
      status: order.status,
      rejectReason: order.rejectReason,
      address: cleanAddress,
      customerPhone: cleanPhone,
      distanceKm,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.nameAtOrder,
        quantity: item.quantity,
        price: Number(item.priceAtOrder),
        imageUrl: item.menuItem?.imageUrl,
      })),
      review: order.review
        ? {
            id: order.review.id,
            rating: order.review.rating,
            comment: order.review.comment,
            createdAt: order.review.createdAt.toISOString(),
          }
        : null,
    }
  })

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
              My Orders &amp; Feasts
            </h1>
            <p className="text-[#717972] text-sm mt-1">
              View your past orders, delivery tracking, re-order your favorites, and leave reviews
            </p>
          </div>

          <OrderHistory orders={formattedOrders} />
        </div>
      </main>
      <CustomerFooter />
    </div>
  )
}
