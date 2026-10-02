"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
  calculateDistance,
  calculateDeliveryFee,
  validateDeliveryAddress,
  formatGranularAddress,
  validatePhoneNumber,
} from "@/lib/utils"
import {
  KITCHEN_COORDS,
  PREP_TIME_MINS,
  MAX_RADIUS_KM,
  FOOD_GST_PERCENT,
  type PlaceOrderPayload,
} from "@/lib/constants"

export async function addToCart(menuItemId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Please log in first.", code: "UNAUTHENTICATED" }
  }

  try {
    // 1. Ensure user exists in database to prevent CartItem_userId_fkey foreign key constraint violations
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })

    if (!user) {
      if (session.user.email) {
        // Recover user if wiped during prisma migrate reset
        user = await prisma.user.upsert({
          where: { email: session.user.email.toLowerCase() },
          update: {},
          create: {
            id: session.user.id,
            email: session.user.email.toLowerCase(),
            name: session.user.name || "Customer",
            password: "",
            role: (session.user.role as any) || "USER",
          },
          select: { id: true },
        })
      } else {
        return { error: "Please log in first.", code: "SESSION_STALE" }
      }
    }

    // 2. Verify menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { id: true, available: true },
    })

    if (!menuItem) {
      return { error: "Menu item not found." }
    }

    // 3. Upsert cart item safely
    const existing = await prisma.cartItem.findUnique({
      where: { userId_menuItemId: { userId: user.id, menuItemId } },
    })

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + 1 },
      })
    } else {
      await prisma.cartItem.create({
        data: { userId: user.id, menuItemId, quantity: 1 },
      })
    }

    revalidatePath("/")
    revalidatePath("/menu")
    revalidatePath("/cart")
    return { success: true }
  } catch (err) {
    console.error("[addToCart] Error adding item to cart:", err)
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

export async function getDeliveryMetrics(destLat: number, destLng: number) {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const origin = `${KITCHEN_COORDS.lat},${KITCHEN_COORDS.lng}`;
  const destination = `${destLat},${destLng}`;

  let distanceKm = "3.5";
  let travelMins = 15;
  let formattedAddress = "Sadar, Nagpur, Maharashtra";

  if (apiKey) {
    // 1. Distance Matrix API call wrapped in try/catch to gracefully handle fetch failed
    try {
      const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
      const distRes = await fetch(distUrl, { next: { revalidate: 60 } });
      if (distRes.ok) {
        const distData = await distRes.json();
        const elem = distData.rows?.[0]?.elements?.[0];
        if (elem && elem.status === "OK") {
          distanceKm = (elem.distance.value / 1000).toFixed(1);
          travelMins = Math.ceil(elem.duration.value / 60);
        }
      }
    } catch (distErr) {
      console.warn("[getDeliveryMetrics] Distance Matrix fetch failed, using fallback:", distErr);
    }

    // 2. Geocoding API call wrapped in try/catch to gracefully handle fetch failed
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${destination}&key=${apiKey}`;
      const geoRes = await fetch(geoUrl, { next: { revalidate: 60 } });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results?.[0]?.formatted_address) {
          formattedAddress = geoData.results[0].formatted_address.replace(/, India$/, "");
        }
      }
    } catch (geoErr) {
      console.warn("[getDeliveryMetrics] Geocoding fetch failed, using fallback:", geoErr);
    }
  }

  // Fallback distance calculation via Haversine formula if API failed or offline
  if (distanceKm === "3.5" && (destLat !== KITCHEN_COORDS.lat || destLng !== KITCHEN_COORDS.lng)) {
    const haversineKm = calculateDistance(KITCHEN_COORDS.lat, KITCHEN_COORDS.lng, destLat, destLng);
    if (!isNaN(haversineKm) && haversineKm > 0) {
      distanceKm = haversineKm.toFixed(1);
      travelMins = Math.max(1, Math.ceil((haversineKm / 25) * 60));
    }
  }

  // Add mandatory 15-minute kitchen prep time to final ETA calculation
  const prepMins = PREP_TIME_MINS; // 15 mins
  const totalEtaMins = travelMins + prepMins;

  return {
    formattedAddress,
    distanceKm,
    travelMins,
    prepMins,
    totalEtaMins,
    etaRangeText: `${totalEtaMins}-${totalEtaMins + 10} min`,
  };
}

export async function calculateDeliveryTime(destLat: number, destLng: number) {
  const metrics = await getDeliveryMetrics(destLat, destLng);
  return {
    travelMins: metrics.travelMins,
    prepMins: metrics.prepMins,
    totalEtaMins: metrics.totalEtaMins,
    distanceKm: Number(metrics.distanceKm),
    etaRangeText: metrics.etaRangeText,
  };
}

export async function reverseGeocodeAction(lat: number, lng: number) {
  try {
    const metrics = await getDeliveryMetrics(lat, lng);
    return { address: metrics.formattedAddress };
  } catch {
    return { address: "Sadar, Nagpur, Maharashtra" };
  }
}

export async function placeOrder(
  addressOrPayload: string | PlaceOrderPayload
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Please log in first." }

  let pinLat: number
  let pinLng: number
  let phone: string
  let textAddress: string
  let providedEtaMins: number | undefined
  let deviceFingerprint: string | undefined
  let saveAddressToProfile: boolean | undefined
  let addressLabel: string | undefined
  let flatDetails: string | undefined

  if (typeof addressOrPayload === "object" && addressOrPayload !== null) {
    pinLat = addressOrPayload.drop.lat
    pinLng = addressOrPayload.drop.lng
    phone = addressOrPayload.drop.phone
    textAddress = addressOrPayload.drop.address
    providedEtaMins = addressOrPayload.etaMins
    deviceFingerprint = addressOrPayload.deviceFingerprint
    saveAddressToProfile = addressOrPayload.saveAddressToProfile
    addressLabel = addressLabel || addressOrPayload.addressLabel
    flatDetails = addressOrPayload.flatDetails
  } else {
    const address = addressOrPayload
    if (!address || typeof address !== "string") {
      return { error: "Please enter a complete delivery address." }
    }

    // 1. Verify map pin coordinates
    const pinMatch = address.match(/\(Pinned:\s*([\d.-]+),\s*([\d.-]+)\)$/)
    if (!pinMatch) {
      return { error: "Please drop the pin on your exact delivery location." }
    }

    pinLat = parseFloat(pinMatch[1])
    pinLng = parseFloat(pinMatch[2])

    // 2. Verify contact mobile number
    const phoneMatch = address.match(/\(Phone:\s*([^\)]+)\)/)
    if (!phoneMatch) {
      return { error: "Please provide a valid contact mobile number." }
    }
    phone = phoneMatch[1]

    // 3. Verify text address
    textAddress = address
      .replace(/\s*\(Pinned:[^)]+\)$/, "")
      .replace(/\s*\(Phone:[^)]+\)$/, "")
      .trim()
  }

  if (isNaN(pinLat) || isNaN(pinLng)) {
    return { error: "Invalid map coordinates provided." }
  }

  const isDefaultKitchen =
    Math.abs(pinLat - KITCHEN_COORDS.lat) < 0.0001 &&
    Math.abs(pinLng - KITCHEN_COORDS.lng) < 0.0001

  if (isDefaultKitchen) {
    return { error: "Please drop the pin on your exact delivery location." }
  }

  const distance = calculateDistance(KITCHEN_COORDS.lat, KITCHEN_COORDS.lng, pinLat, pinLng)
  if (distance > MAX_RADIUS_KM) {
    return { error: "Out of 8km delivery zone." }
  }

  const phoneValidation = validatePhoneNumber(phone)
  if (!phoneValidation.isValid) {
    return { error: phoneValidation.error || "Please enter a valid 10-digit Indian mobile number." }
  }

  const addressValidation = validateDeliveryAddress(textAddress)
  if (!addressValidation.isValid) {
    return { error: addressValidation.error || "Please enter a complete delivery address (minimum 15 characters)." }
  }

  let totalEtaMins = providedEtaMins
  if (!totalEtaMins) {
    const etaData = await calculateDeliveryTime(pinLat, pinLng)
    totalEtaMins = etaData.totalEtaMins
  }

  const porterPayload = {
    pickup: KITCHEN_COORDS,
    drop: {
      lat: pinLat,
      lng: pinLng,
      address: textAddress,
      phone: phoneValidation.cleanedNumber || phone.trim(),
    },
    distanceKm: distance.toFixed(1),
    etaMins: totalEtaMins,
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { menuItem: true },
    })

    if (cartItems.length === 0) return { error: "Your cart is empty." }

    const itemTotal = cartItems.reduce(
      (sum, ci) => sum + Number(ci.menuItem.price) * ci.quantity,
      0
    )
    const gstAmount = Math.round(itemTotal * (FOOD_GST_PERCENT / 100))

    // DYNAMIC PRICING FIX: calculate distance-based delivery fee as master single source of truth
    const deliveryFee = calculateDeliveryFee(distance)
    const grandTotal = itemTotal + gstAmount + deliveryFee

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalPrice: grandTotal,
        deliveryFee: deliveryFee,
        address: JSON.stringify(porterPayload),
        deviceFingerprint: deviceFingerprint || null,
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

    // Optionally save address to profile for future 1-click checkout
    if (saveAddressToProfile && session.user?.id) {
      try {
        await prisma.savedAddress.create({
          data: {
            userId: session.user.id,
            label: addressLabel || "Home",
            flatDetails: flatDetails?.trim() || textAddress.split(",")[0] || "Flat/House",
            fullAddress: textAddress,
            lat: pinLat,
            lng: pinLng,
          },
        })
      } catch (err) {
        console.warn("Failed to auto-save address to profile:", err)
      }
    }

    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } })

    // Notify backend Express server to broadcast order:created to KDS via Socket.io
    try {
      const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"
      await fetch(`${backendUrl}/api/orders/notify-created`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          deviceFingerprint: deviceFingerprint || undefined,
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {})
    } catch {
      // non-blocking
    }

    revalidatePath("/")
    revalidatePath("/orders")
    return { success: true, orderId: order.id }
  } catch (err) {
    console.error("placeOrder error:", err)
    return { error: "Failed to place order." }
  }
}
