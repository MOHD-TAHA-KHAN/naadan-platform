import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CustomerHeader } from "@/components/customer/customer-header"
import { CustomerFooter } from "@/components/customer/footer"
import { AddToCartButton } from "@/components/customer/add-to-cart-button"
import { CategoryFilter } from "@/components/customer/category-filter"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Menu | Naadan" }

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const params = await searchParams
  const activeCategory = params.category ?? "all"

  const [categoriesWithItems, cartCount] = await Promise.all([
    prisma.category.findMany({
      include: { menuItems: { where: { available: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.cartItem.count({ where: { userId: session.user.id } }),
  ])

  const allItems = categoriesWithItems.flatMap((c) =>
    c.menuItems.map((item) => ({ ...item, categoryName: c.name }))
  )

  const filtered =
    activeCategory === "all"
      ? allItems
      : allItems.filter((i) => {
          const cat = categoriesWithItems.find((c) => c.id === activeCategory)
          return cat?.menuItems.some((m) => m.id === i.id)
        })

  return (
    <div className="min-h-screen bg-[#fdf9f1]">
      <CustomerHeader
        cartCount={cartCount}
        activePage="menu"
        userName={session.user.name}
      />

      <main className="w-full pt-[calc(4rem+2.5rem)] md:pt-[calc(4rem+2.5rem+1.5rem)]">
        {/* Hero section */}
        <section className="w-full px-4 lg:px-8 py-10 lg:py-16 bg-[#fdf9f1]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1ede6] text-[#7b5900] text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">stars</span>
                THE AUTHENTIC MALABAR &amp; TRAVANCORE SANCTUARY
              </div>
              <h1
                className="text-4xl lg:text-5xl font-bold text-[#002211] tracking-tight leading-tight"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Kerala flavours,<br />now in Nagpur.
              </h1>
              <p className="text-[#7b5900] text-xl italic" style={{ fontFamily: "Playfair Display, serif" }}>
                Order comfort.
              </p>
              <p className="text-[#414942] text-base leading-relaxed max-w-lg">
                Slow-cooked in seasoned earthen pots, wrapped in singed banana leaves, and delivered warm
                across Civil Lines, Dharampeth, and Ramdaspeth. Pure heritage recipes untouched by short-cuts.
              </p>
              <div className="grid grid-cols-3 gap-4 bg-[#f7f3eb] p-4 rounded-xl mt-2">
                <div>
                  <div className="text-xl font-bold text-[#002211]">4.9 ★</div>
                  <div className="text-xs text-[#717972]">1,400+ Nagpur Diners</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#002211]">100%</div>
                  <div className="text-xs text-[#717972]">Biodegradable Clay &amp; Leaf</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#002211]">0%</div>
                  <div className="text-xs text-[#717972]">Artificial Flavours / MSG</div>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="w-full h-80 rounded-2xl overflow-hidden shadow-xl bg-[#ebe8e0]">
                <Image
                  src="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"
                  alt="Authentic Kerala banana leaf feast"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002211]/70 via-transparent to-transparent flex items-end p-6">
                  <div>
                    <p className="text-[10px] font-semibold text-[#ffdea4] tracking-widest uppercase">Signature Feast</p>
                    <h2 className="font-bold text-xl text-white" style={{ fontFamily: "Playfair Display, serif" }}>
                      The Coastal Sadya &amp; Meen Curry
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy strip */}
        <section className="w-full bg-[#f7f3eb] py-8 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            {[
              { icon: "soup_kitchen", title: "Stone-Crushed Masalas", desc: "Shallots, whole black pepper, and curry leaves hand-ground on ammikallu stones." },
              { icon: "eco", title: "Cold-Pressed Coconut Oil", desc: "Sourced from smallholder groves in Kozhikode for uncompromised aroma." },
              { icon: "verified", title: "Zero Reheating Policy", desc: "Fresh batches prepared every 3 hours at our Civil Lines cloud station." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#fcca66] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px] text-[#755400]">{icon}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-[#002211] text-sm">{title}</h4>
                  <p className="text-xs text-[#717972]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Menu grid section */}
        <section className="w-full px-4 lg:px-8 py-10" id="menu-grid">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#7b5900] uppercase tracking-widest mb-1">
                  Carefully Curated Flavours
                </p>
                <h2
                  className="text-3xl font-bold text-[#002211]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  The Naadan Kitchen Menu
                </h2>
                <p className="text-[#414942] text-sm mt-1">
                  Cooked on order with artisanal techniques, wholesome marinades, and fresh tempered spices.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#f1ede6] px-4 py-2 rounded-xl">
                <span className="material-symbols-outlined text-[#7b5900] text-[18px]">room_service</span>
                <div>
                  <div className="text-xs text-[#717972]">Nagpur Delivery Hub</div>
                  <div className="text-xs font-semibold text-[#002211]">Civil Lines (28-35 mins)</div>
                </div>
              </div>
            </div>

            {/* Category filter tabs */}
            <CategoryFilter
              categories={categoriesWithItems.map((c) => ({ id: c.id, name: c.name }))}
              activeCategory={activeCategory}
            />

            {/* Menu Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {filtered.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between bg-[#ffffff] rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-[#f1ede6]"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="relative w-full h-52 rounded-xl overflow-hidden bg-[#f1ede6]">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[48px] text-[#c0c9c0]">restaurant</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-[#ffffff]/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-semibold text-[#414942]">
                          {item.categoryName}
                        </div>
                      </div>

                      <div>
                        <h3
                          className="font-bold text-lg text-[#002211] leading-tight"
                          style={{ fontFamily: "Playfair Display, serif" }}
                        >
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-[#717972] line-clamp-2 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#f1ede6]">
                      <div>
                        <div className="text-lg font-bold text-[#002211]">
                          ₹{Number(item.price).toFixed(0)}
                        </div>
                      </div>
                      <AddToCartButton menuItemId={item.id} itemName={item.name} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-[#c0c9c0] p-12 text-center">
                <span className="material-symbols-outlined text-[48px] text-[#c0c9c0] block mb-3">restaurant_menu</span>
                <h3 className="font-semibold text-[#002211]">No items in this category yet</h3>
                <p className="text-sm text-[#717972] mt-1">
                  Run <code className="font-mono bg-[#f1ede6] px-1 rounded">npx prisma db seed</code> to populate the menu.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <CustomerFooter />
    </div>
  )
}
