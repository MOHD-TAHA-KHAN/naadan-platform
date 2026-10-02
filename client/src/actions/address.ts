"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface SaveAddressInput {
  id?: string
  label?: string
  flatDetails: string
  street?: string
  fullAddress: string
  lat: number
  lng: number
  isDefault?: boolean
}

export async function getUserSavedAddresses() {
  const session = await auth()
  if (!session?.user?.id) return []

  try {
    const addresses = await prisma.savedAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })
    return addresses
  } catch (error) {
    console.error("Failed to fetch saved addresses:", error)
    return []
  }
}

export async function saveUserAddress(input: SaveAddressInput) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Please log in first." }

  if (!input.flatDetails?.trim()) {
    return { error: "Please provide flat, house, or floor details." }
  }
  if (!input.fullAddress?.trim()) {
    return { error: "Please provide a valid address." }
  }
  if (isNaN(input.lat) || isNaN(input.lng)) {
    return { error: "Valid map coordinates are required." }
  }

  try {
    if (input.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    let address
    if (input.id) {
      address = await prisma.savedAddress.update({
        where: { id: input.id, userId: session.user.id },
        data: {
          label: input.label?.trim() || "Home",
          flatDetails: input.flatDetails.trim(),
          street: input.street?.trim() || null,
          fullAddress: input.fullAddress.trim(),
          lat: input.lat,
          lng: input.lng,
          isDefault: input.isDefault ?? false,
        },
      })
    } else {
      address = await prisma.savedAddress.create({
        data: {
          userId: session.user.id,
          label: input.label?.trim() || "Home",
          flatDetails: input.flatDetails.trim(),
          street: input.street?.trim() || null,
          fullAddress: input.fullAddress.trim(),
          lat: input.lat,
          lng: input.lng,
          isDefault: input.isDefault ?? false,
        },
      })
    }

    revalidatePath("/cart")
    revalidatePath("/profile")
    return { success: true, address }
  } catch (error) {
    console.error("Failed to save address:", error)
    return { error: "Failed to save address to profile." }
  }
}

export async function deleteUserAddress(addressId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Please log in first." }

  try {
    await prisma.savedAddress.delete({
      where: { id: addressId, userId: session.user.id },
    })

    revalidatePath("/cart")
    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete address:", error)
    return { error: "Failed to delete address." }
  }
}
