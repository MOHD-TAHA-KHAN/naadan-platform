"use server"

import { prisma } from "@/lib/prisma"

export async function loadMoreItems(skip: number, categoryId?: string) {
  const items = await prisma.menuItem.findMany({
    where: {
      available: true,
      ...(categoryId && categoryId !== "all" ? { categoryId } : {}),
    },
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: { name: "asc" },
    take: 20,
    skip,
  })

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    categoryName: item.category?.name ?? "General",
  }))
}
