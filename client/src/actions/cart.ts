"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculateDistance, validateDeliveryAddress, formatGranularAddress, validatePhoneNumber } from "@/lib/utils"

const KITCHEN_COORDS = { lat: 21.1610, lng: 79.0838 }
const MAX_RADIUS_KM = 8

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

  if (!address || typeof address !== "string") {
    return { error: "Please enter a complete delivery address." }
  }

  // 1. Verify map pin coordinates
  const pinMatch = address.match(/\(Pinned:\s*([\d.-]+),\s*([\d.-]+)\)$/)
  if (!pinMatch) {
    return { error: "Please drop the pin on your exact delivery location." }
  }

  const pinLat = parseFloat(pinMatch[1])
  const pinLng = parseFloat(pinMatch[2])

  if (isNaN(pinLat) || isNaN(pinLng)) {
    return { error: "Invalid map coordinates provided." }
  }

  const isDefaultKitchen =
    (Math.abs(pinLat - KITCHEN_COORDS.lat) < 0.0001 && Math.abs(pinLng - KITCHEN_COORDS.lng) < 0.0001) ||
    (pinLat === 21.1458 && pinLng === 79.0882)

  if (isDefaultKitchen) {
    return { error: "Please drop the pin on your exact delivery location." }
  }

  const distance = calculateDistance(KITCHEN_COORDS.lat, KITCHEN_COORDS.lng, pinLat, pinLng)
  if (distance > MAX_RADIUS_KM) {
    return { error: "Out of 8km delivery zone." }
  }

  // 2. Verify contact mobile number
  const phoneMatch = address.match(/\(Phone:\s*([^\)]+)\)/)
  if (!phoneMatch) {
    return { error: "Please provide a valid contact mobile number." }
  }
  const phoneValidation = validatePhoneNumber(phoneMatch[1])
  if (!phoneValidation.isValid) {
    return { error: phoneValidation.error || "Please enter a valid 10-digit Indian mobile number." }
  }

  // 3. Verify text address
  const textAddress = address
    .replace(/\s*\(Pinned:[^)]+\)$/, "")
    .replace(/\s*\(Phone:[^)]+\)$/, "")
    .trim()
  const addressValidation = validateDeliveryAddress(textAddress)
  if (!addressValidation.isValid) {
    return { error: addressValidation.error || "Please enter a complete delivery address (minimum 15 characters)." }
  }

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

export async function reverseGeocodeAction(lat: number, lng: number) {
  // 1. Try Ola Maps API
  try {
    const olaRes = await fetch(
      `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=NgUrx6PuNv5JMgAQhWAZyfmG9PcGOR3b`,
      {
        headers: {
          "X-Request-Id": `req-${Date.now()}`,
        },
      }
    )
    if (olaRes.ok) {
      const data = await olaRes.json()
      if (data?.results?.[0]?.formatted_address) {
        return { address: data.results[0].formatted_address }
      }
    }
  } catch {
    // Ignore and proceed to fallback
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "NaadanDeliveryPlatform/1.0",
          "Accept-Language": "en",
        },
      }
    )
    if (!res.ok) return { error: "Failed to reverse geocode" }
    const data = await res.json()
    const formattedAddress = formatGranularAddress(data?.address) || data?.display_name || ""
    return { address: formattedAddress }
  } catch {
    return { error: "Failed to reach geocoding service" }
  }
}



