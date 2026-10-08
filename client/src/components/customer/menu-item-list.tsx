"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { AddToCartButton } from "@/components/customer/add-to-cart-button"
import { loadMoreItems } from "@/actions/menu"

export interface MenuItemData {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  categoryName: string
}

export function MenuItemList({
  initialItems,
  activeCategory,
}: {
  initialItems: MenuItemData[]
  activeCategory: string
}) {
  const [items, setItems] = useState<MenuItemData[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialItems.length === 20)

  useEffect(() => {
    setItems(initialItems)
    setHasMore(initialItems.length === 20)
  }, [initialItems, activeCategory])

  async function handleLoadMore() {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const more = await loadMoreItems(items.length, activeCategory)
      if (more.length < 20) {
        setHasMore(false)
      }
      setItems((prev) => [...prev, ...more])
    } catch (err) {
      console.error("Failed to load more items:", err)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#c0c9c0] p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-[#c0c9c0] block mb-3">restaurant_menu</span>
        <h3 className="font-semibold text-[#002211]">No items in this category yet</h3>
        <p className="text-sm text-[#717972] mt-1">
          Run <code className="font-mono bg-[#f1ede6] px-1 rounded">npx prisma db seed</code> to populate the menu.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {items.map((item) => (
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

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-8 py-3 rounded-full bg-[#002211] text-white font-medium hover:bg-[#002211]/90 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            {loading && (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            )}
            {loading ? "Loading..." : "Load More Items"}
          </button>
        </div>
      )}
    </div>
  )
}
