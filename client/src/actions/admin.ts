"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function assertAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  return session
}

export async function toggleMenuItemAvailability(itemId: string, available: boolean) {
  await assertAdmin()
  try {
    await prisma.menuItem.update({
      where: { id: itemId },
      data: { available },
    })
    revalidatePath("/")
    revalidatePath("/admin/menu-toggles")
    return { success: true }
  } catch {
    return { error: "Failed to toggle item." }
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const res = await fetch(
      "http://127.0.0.1:3001/api/kds/orders/" + encodeURIComponent(orderId) + "/status",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    )
    if (!res.ok) return { error: "Failed to update order status." }
    const data = (await res.json()) as { success?: boolean; error?: string }
    return data
  } catch {
    return { error: "Failed to update order status." }
  }
}