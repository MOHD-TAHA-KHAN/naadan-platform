"use server"

import { auth } from "../../auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addToCart(menuItemId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Please log in first." }

  try {
    const existing = await prisma.cartItem.findUnique({
      where: { userId_menuItemId: { userId: session.user.id, menuItemId } },
    })

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + 1 },
      })
    } else {
      await prisma.cartItem.create({
        data: { userId: session.user.id, menuItemId, quantity: 1 },
      })
    }

    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Failed to add to cart." }
  }
}

export async function removeFromCart(cartItemId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  try {
    await prisma.cartItem.delete({ where: { id: cartItemId } })
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Failed to remove item." }
  }
}

export async function updateCartQty(cartItemId: string, quantity: number) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  try {
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } })
    } else {
      await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } })
    }
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Failed to update quantity." }
  }
}

export async function placeOrder(address: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Please log in first." }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { menuItem: true },
    })

    if (cartItems.length === 0) return { error: "Your cart is empty." }

    const total = cartItems.reduce(
      (sum, ci) => sum + Number(ci.menuItem.price) * ci.quantity,
      0
    )

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalPrice: total,
        address,
        status: "PENDING",
        items: {
          create: cartItems.map((ci) => ({
            menuItemId: ci.menuItemId,
            quantity: ci.quantity,
            priceAtOrder: ci.menuItem.price,
            nameAtOrder: ci.menuItem.name,
          })),
        },
      },
    })

    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } })

    revalidatePath("/")
    return { success: true, orderId: order.id }
  } catch {
    return { error: "Failed to place order." }
  }
}
