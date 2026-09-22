import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { MenuToggleRow } from "@/components/admin/menu-toggle-row"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Menu Toggles | Naadan Admin" }

export default async function MenuTogglesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/")

  const categoriesWithItems = await prisma.category.findMany({
    include: {
      menuItems: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          available: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const categoriesWithTransformedItems = categoriesWithItems.map((category) => ({
    ...category,
    menuItems: category.menuItems.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }))

  const totalItems = categoriesWithTransformedItems.flatMap((c) => c.menuItems).length
  const availableItems = categoriesWithTransformedItems.flatMap((c) => c.menuItems).filter((i) => i.available).length
  const soldOutItems = totalItems - availableItems

  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin/menu-toggles" staffName={session.user.name} />

      <div className="pl-64 flex-1">
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#033921] text-[#ffdea4] text-[10px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fcca66] animate-ping" />
              86ing &amp; Live Stock Terminal
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
              {availableItems} in stock
            </span>
            {soldOutItems > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
                {soldOutItems} sold out
              </span>
            )}
          </div>
        </header>

        <main className="pt-16 p-6 min-h-screen space-y-6">
          <div className="bg-[#f7f3eb] px-4 py-3 rounded-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#033921] text-[#ffdea4] text-[10px] font-semibold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fcca66] animate-ping" />
                    86ing &amp; Live Stock Terminal
                  </span>
                  <span className="text-xs text-[#717972] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#7b5900]">hub</span>
                    Nagpur Central Kitchen
                  </span>
                </div>
                <h1 className="text-xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
                  Menu Toggles &amp; Live Availability
                </h1>
                <p className="text-xs text-[#717972] mt-0.5">
                  Toggle items on/off instantly. Changes reflect on customer menu in real-time.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono text-[#002211]">{totalItems}</p>
                  <p className="text-[10px] text-[#717972]">Total Items</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono text-[#38684c]">{availableItems}</p>
                  <p className="text-[10px] text-[#717972]">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono text-[#ba1a1a]">{soldOutItems}</p>
                  <p className="text-[10px] text-[#717972]">86&apos;d / Off</p>
                </div>
              </div>
            </div>
          </div>

          {categoriesWithTransformedItems.map((category) => (
            <div key={category.id} className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f1ede6] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f1ede6] bg-[#f7f3eb] flex items-center justify-between">
                <h2 className="font-bold text-sm text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
                  {category.name}
                </h2>
                <span className="text-xs text-[#717972]">
                  {category.menuItems.filter((i) => i.available).length} / {category.menuItems.length} available
                </span>
              </div>
              <div className="divide-y divide-[#f1ede6]">
                {category.menuItems.map((item) => (
                  <MenuToggleRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}
