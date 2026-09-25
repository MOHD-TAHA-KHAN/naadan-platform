"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface ActionState {
  error?: string
  success?: boolean
}

export async function submitReview(orderId: string, rating: number, comment?: string): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Please log in first." }
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    })

    if (!order) {
      return { error: "Order not found." }
    }

    if (order.userId !== session.user.id) {
      return { error: "You can only review your own orders." }
    }

    if (order.review) {
      return { error: "You have already reviewed this order." }
    }

    if (order.status !== "DELIVERED") {
      return { error: "You can only review delivered orders." }
    }

    await prisma.review.create({
      data: {
        orderId,
        userId: session.user.id,
        rating,
        comment: comment || null,
      },
    })

    revalidatePath("/orders")
    return { success: true }
  } catch {
    return { error: "Failed to submit review." }
  }
}
