import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CustomerHeader } from "@/components/customer/customer-header"
import { CustomerFooter } from "@/components/customer/footer"
import { CartItemRow } from "@/components/customer/cart-item-row"
import { CheckoutForm } from "@/components/customer/checkout-form"
import { OrderSummary } from "@/components/customer/OrderSummary"
import { CartProvider } from "@/context/CartContext"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Cart & Checkout | Naadan" }

export default async function CartPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const [cartItems, userProfile, savedAddresses] = await Promise.all([
    prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { menuItem: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    }),
    prisma.savedAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ])

  // Convert Prisma Decimal price to standard number before passing to Client Components
  const serializedItems = cartItems.map((ci) => ({
    ...ci,
    price: Number((ci as any).price ?? ci.menuItem.price),
    menuItem: {
      ...ci.menuItem,
      price: Number(ci.menuItem.price),
    },
  }))

  const serializedAddresses = savedAddresses.map((sa) => ({
    id: sa.id,
    userId: sa.userId,
    label: sa.label,
    flatDetails: sa.flatDetails,
    street: sa.street,
    fullAddress: sa.fullAddress,
    lat: sa.lat,
    lng: sa.lng,
    isDefault: sa.isDefault,
  }))

  return (
    <div className="min-h-screen bg-[#fdf9f1]">
      <CustomerHeader
        cartCount={serializedItems.reduce((s, ci) => s + ci.quantity, 0)}
        activePage="cart"
        userName={session.user.name}
      />

      <main className="w-full pt-[calc(4rem+2.5rem)] md:pt-[calc(4rem+2.5rem+1.5rem)] px-4 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-[#717972] mb-6">
            <a href="/menu" className="hover:text-[#002211]">Menu</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#002211] font-semibold">Cart &amp; Checkout</span>
          </nav>

          {/* Kitchen ticker */}
          <div className="w-full bg-[#033921] text-white py-2 px-4 rounded-xl flex items-center justify-between mb-8 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#fcca66] animate-pulse" />
              <span className="text-[10px] font-semibold tracking-widest uppercase text-[#ffdea4]">Live Kitchen Status:</span>
              <span className="text-xs text-[#baefcb]">Sadar Handi Station active • Dum timer 18m remaining</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-[#baefcb]">
              <span className="material-symbols-outlined text-[14px] text-[#fcca66]">verified</span>
              <span className="text-xs">FSSAI Lic. 11523034000492</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#7b5900] text-[20px]">skillet</span>
                <span className="text-xs font-semibold text-[#7b5900] uppercase tracking-wider">Crafted in Earthen Handis</span>
              </div>
              <h1 className="text-3xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
                Your Artisanal Feast
              </h1>
              <p className="text-[#414942] text-sm mt-1">
                Freshly prepared upon your order in seasoned earthen pots, wrapped in smoked banana leaf packaging.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#414942] bg-[#f1ede6] px-4 py-2 rounded-full self-start">
              <span className="material-symbols-outlined text-[#7b5900] text-[16px]">schedule</span>
              <span className="text-xs font-semibold text-[#002211]">Nagpur Direct:</span>
              <span className="text-xs">Avg delivery 28–35 mins</span>
            </div>
          </div>

          {serializedItems.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-[64px] text-[#c0c9c0] block mb-4">shopping_bag</span>
              <h2 className="text-xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
                Your feast awaits
              </h2>
              <p className="text-[#717972] mt-2 mb-6">Add some authentic Kerala dishes from our menu.</p>
              <a
                href="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#fcca66] text-[#755400] font-semibold hover:bg-[#f0bf5c] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Explore Menu
              </a>
            </div>
          ) : (
            <CartProvider
              initialItems={serializedItems as any}
              initialSavedAddresses={serializedAddresses}
              initialPhone={userProfile?.phone || ""}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left — cart items */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                  <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6 border border-[#f1ede6]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
                        Your Order ({serializedItems.length} {serializedItems.length === 1 ? "item" : "items"})
                      </h2>
                      <a href="/menu" className="text-xs font-semibold text-[#7b5900] hover:underline">
                        + Add more items
                      </a>
                    </div>
                    <div className="flex flex-col gap-4 divide-y divide-[#f1ede6]">
                      {serializedItems.map((ci) => (
                        <CartItemRow key={ci.id} cartItem={ci} />
                      ))}
                    </div>
                  </div>

                  {/* Eco packaging note */}
                  <div className="bg-[#f7f3eb] rounded-xl p-4 flex items-start gap-3 border border-[#c0c9c0]/30">
                    <span className="material-symbols-outlined text-[22px] text-[#38684c] shrink-0 mt-0.5">inventory_2</span>
                    <div>
                      <p className="text-sm font-semibold text-[#002211]">Earthen Pot Dum Delivery</p>
                      <p className="text-xs text-[#717972] mt-0.5">
                        Delivered steaming hot in reusable unglazed terracotta pots. Heat-sealed with palm leaves.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right — Single source of truth synchronized summary + checkout */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
                  {/* Master Order Summary component directly wired to CartContext */}
                  <OrderSummary />

                  {/* Checkout Form directly wired to CartContext */}
                  <CheckoutForm />
                </div>
              </div>
            </CartProvider>
          )}
        </div>
      </main>
      <CustomerFooter />
    </div>
  )
}
