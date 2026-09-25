"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface CategoryFilterProps {
  categories: { id: string; name: string }[]
  activeCategory: string
}

export function CategoryFilter({ categories, activeCategory }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setCategory(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (id === "all") {
      params.delete("category")
    } else {
      params.set("category", id)
    }
    router.push(`/menu?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => setCategory("all")}
        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          activeCategory === "all"
            ? "bg-[#002211] text-white"
            : "bg-[#f1ede6] text-[#414942] hover:bg-[#ebe8e0]"
        }`}
      >
        All Specialities
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setCategory(cat.id)}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategory === cat.id
              ? "bg-[#002211] text-white"
              : "bg-[#f1ede6] text-[#414942] hover:bg-[#ebe8e0]"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
