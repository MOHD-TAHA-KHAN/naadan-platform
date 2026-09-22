"use server"

import { auth } from "../../auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function assertAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  return session
}

export async function updateOrderStatus(orderId: string, status: string) {
  await assertAdmin()
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: status as never },
    })
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Failed to update order status." }
  }
}

export async function toggleMenuItemAvailability(itemId: string, available: boolean) {
  await assertAdmin()
  try {
    await prisma.menuItem.update({
      where: { id: itemId },
      data: { available },
    })
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Failed to toggle item." }
  }
}
