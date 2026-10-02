import { Server as SocketIOServer } from "socket.io"
import { prisma } from "../db/prisma"
import { KITCHEN_COORDS, KITCHEN_PHONE, PREP_TIME_MINS } from "../constants"
import type { OrderStatus } from "../types"

// Delay before triggering Porter API: 8 minutes (480,000 ms).
// Rider ETA is 5-7 mins in Sadar, Nagpur -> Arrives right at 15m prep completion.
export const PORTER_DISPATCH_DELAY_MS = Number(
  process.env.PORTER_DISPATCH_DELAY_MS || 8 * 60 * 1000
)

const PORTER_API_BASE = process.env.PORTER_API_BASE_URL || "https://papi-sandbox.porter.in"
const PORTER_API_KEY = process.env.PORTER_API_KEY || ""

interface ScheduledDispatch {
  timeout: NodeJS.Timeout
  scheduledFor: number
  orderId: string
}

const activeDispatches = new Map<string, ScheduledDispatch>()
let socketServer: SocketIOServer | null = null
let legacyBroadcast: ((msg: string) => void) | null = null

export function setPorterSocketInstances(io: SocketIOServer, broadcast: (msg: string) => void) {
  socketServer = io
  legacyBroadcast = broadcast
}

export interface ExtractedOrderDetails {
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  dropAddress: string
  dropCoords: { lat: number; lng: number }
  kitchenCoords: { lat: number; lng: number }
  existingAddressObj: any
}

/**
 * 1. Porter API Payload Builder:
 * Extracts customer, address, and coordinates from order records
 * and constructs standard Porter Open Delivery API v1 booking payload.
 */
export function extractOrderDetails(order: any): ExtractedOrderDetails {
  let dropAddress = "Address details unavailable"
  let customerPhone = order.user?.phone || ""
  let dropCoords = { lat: KITCHEN_COORDS.lat, lng: KITCHEN_COORDS.lng }
  let kitchenCoords = { lat: KITCHEN_COORDS.lat, lng: KITCHEN_COORDS.lng }
  let existingAddressObj: any = {}

  try {
    const rawAddr = order.address
    const parsed = typeof rawAddr === "string" ? JSON.parse(rawAddr) : rawAddr
    existingAddressObj = parsed || {}

    if (parsed?.drop?.address) dropAddress = parsed.drop.address
    else if (typeof rawAddr === "string" && !rawAddr.startsWith("{")) dropAddress = rawAddr

    if (parsed?.drop?.phone) customerPhone = parsed.drop.phone
    if (parsed?.drop?.lat && parsed?.drop?.lng) {
      dropCoords = { lat: Number(parsed.drop.lat), lng: Number(parsed.drop.lng) }
    }
    if (parsed?.pickup?.lat && parsed?.pickup?.lng) {
      kitchenCoords = { lat: Number(parsed.pickup.lat), lng: Number(parsed.pickup.lng) }
    }
  } catch {
    if (typeof order.address === "string") dropAddress = order.address
  }

  // Clean customer phone (ensure 10 digits with +91)
  const phoneDigits = customerPhone.replace(/\D/g, "").slice(-10)
  const formattedPhone = phoneDigits.length === 10 ? `+91${phoneDigits}` : customerPhone || "+919876543210"

  return {
    orderId: order.id,
    orderNumber: order.id.slice(-6).toUpperCase(),
    customerName: order.user?.name || "Valued Customer",
    customerPhone: formattedPhone,
    dropAddress,
    dropCoords,
    kitchenCoords,
    existingAddressObj,
  }
}

export function buildPorterOrderPayload(order: any) {
  const details = extractOrderDetails(order)
  const pinMatch = details.dropAddress?.match(/\b(44\d{4}|\d{6})\b/)
  const dropPincode = pinMatch ? pinMatch[0] : "440001"

  // 15-minute prep timestamp (Unix seconds) for scheduled pickup endpoint
  const pickupTimeUnix = Math.floor((Date.now() + PREP_TIME_MINS * 60 * 1000) / 1000)

  return {
    request_id: `ORDER_${details.orderNumber}`,
    delivery_instructions: {
      instructions_list: [
        { type: "text", description: "Hot claypot food package from Naadan Cloud Kitchen. Keep upright." },
      ],
    },
    pickup_details: {
      address: {
        apartment_address: "Naadan Central Kitchen",
        street_address: "Mount Road Extension, Sadar",
        city: "Nagpur",
        state: "Maharashtra",
        pincode: "440001",
        country: "India",
        lat: details.kitchenCoords.lat,
        lng: details.kitchenCoords.lng,
      },
      contact_details: {
        name: "Naadan Kitchen Dispatch",
        phone_number: KITCHEN_PHONE,
      },
      pickup_time: pickupTimeUnix, // Scheduled booking pickup time (current_time + 15 mins)
    },
    drop_details: {
      address: {
        apartment_address: details.dropAddress,
        street_address: details.dropAddress,
        city: "Nagpur",
        state: "Maharashtra",
        pincode: dropPincode,
        country: "India",
        lat: details.dropCoords.lat,
        lng: details.dropCoords.lng,
      },
      contact_details: {
        name: details.customerName,
        phone_number: details.customerPhone,
      },
    },
    additional_comments: `Order #${details.orderNumber} - 15min fresh claypot prep`,
  }
}

/**
 * 2. Porter API Booking Invocation:
 * Executes the create order call to Porter logistics.
 */
export async function executePorterBooking(orderId: string) {
  // Clear registered timer
  if (activeDispatches.has(orderId)) {
    activeDispatches.delete(orderId)
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, phone: true } } },
    })

    if (!order) return
    // Abort if order was cancelled or already in terminal state
    if (["CANCELLED", "REJECTED", "DELIVERED"].includes(order.status)) {
      return
    }

    const payload = buildPorterOrderPayload(order)
    console.log(`[Porter] Dispatching booking for Order #${order.id.slice(-6).toUpperCase()}...`)

    let responseData: any = null

    if (PORTER_API_KEY) {
      const response = await fetch(`${PORTER_API_BASE}/v1/orders/create`, {
        method: "POST",
        headers: {
          "x-api-key": PORTER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Porter API error (${response.status}): ${errorText}`)
      }
      responseData = await response.json()
    } else {
      // Mock Porter API response in dev/sandbox mode
      console.warn("[Porter] No PORTER_API_KEY found, using sandbox mock response.")
      responseData = {
        order_id: `CRN_${order.id.slice(-6).toUpperCase()}`,
        status: "ORDER_CREATED",
        tracking_url: `https://porter.in/track/mock-${order.id.slice(-6).toLowerCase()}`,
      }
    }

    // Persist Porter Reference in order address JSON
    const details = extractOrderDetails(order)
    const updatedAddressObj = {
      ...details.existingAddressObj,
      porterOrderId: responseData.order_id,
      trackingUrl: responseData.tracking_url,
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { address: JSON.stringify(updatedAddressObj) },
    })

    console.log(`[Porter] Order #${order.id.slice(-6).toUpperCase()} booked successfully with Porter ID: ${responseData.order_id}`)
  } catch (error: any) {
    console.error(`[Porter] Booking failed for Order #${orderId}:`, error?.response?.data || error?.message)
  }
}

/**
 * 3. Timing & Background Job Scheduler:
 * Schedules Porter order creation with a 7-10 minute delay (default 8 mins).
 */
export function schedulePorterDispatch(orderId: string, delayMs = PORTER_DISPATCH_DELAY_MS) {
  // Prevent duplicate jobs
  if (activeDispatches.has(orderId)) {
    clearTimeout(activeDispatches.get(orderId)!.timeout)
  }

  const scheduledFor = Date.now() + delayMs
  console.log(`[Porter] Scheduled dispatch for Order #${orderId.slice(-6).toUpperCase()} in ${Math.round(delayMs / 60000)} minutes.`)

  const timeout = setTimeout(() => {
    executePorterBooking(orderId)
  }, delayMs)

  activeDispatches.set(orderId, { timeout, scheduledFor, orderId })
}

export function cancelPorterDispatch(orderId: string) {
  if (activeDispatches.has(orderId)) {
    clearTimeout(activeDispatches.get(orderId)!.timeout)
    activeDispatches.delete(orderId)
    console.log(`[Porter] Cancelled scheduled dispatch for Order #${orderId.slice(-6).toUpperCase()}.`)
  }
}

/**
 * 4. Webhook / Polling Handler:
 * Listens for Porter rider allocation, transitions order to OUT_FOR_DELIVERY,
 * and attaches rider tracking URL and phone to ticket.
 */
export async function handlePorterRiderAssigned(payload: {
  requestId?: string
  orderId?: string
  porterOrderId?: string
  trackingUrl?: string
  driverDetails?: {
    name?: string
    phoneNumber?: string
    vehicleNumber?: string
  }
}) {
  const rawId = payload.requestId || payload.orderId || ""
  const orderNumber = rawId.replace(/^ORDER_/, "")

  // Locate order by ID or orderNumber suffix
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: rawId },
        { id: { endsWith: orderNumber.toLowerCase() } },
        { id: { endsWith: orderNumber } },
      ],
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  })

  if (!order) {
    console.warn(`[Porter Webhook] Order not found for identifier: ${rawId}`)
    return null
  }

  // Update order address JSON with live tracking URL and driver contact details
  let existingAddressObj: any = {}
  try {
    existingAddressObj = typeof order.address === "string" ? JSON.parse(order.address) : order.address || {}
  } catch {
    existingAddressObj = {}
  }

  const updatedAddressObj = {
    ...existingAddressObj,
    trackingUrl: payload.trackingUrl || existingAddressObj.trackingUrl,
    riderName: payload.driverDetails?.name || "Assigned Driver",
    riderPhone: payload.driverDetails?.phoneNumber || "",
    vehicleNumber: payload.driverDetails?.vehicleNumber || "",
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "OUT_FOR_DELIVERY" as OrderStatus,
      address: JSON.stringify(updatedAddressObj),
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  })

  // Broadcast updated status & rider details to KDS and tracking screens via Socket.io
  if (socketServer) {
    const formatted = {
      id: updated.id,
      orderNumber: updated.id.slice(-6).toUpperCase(),
      status: "OUT_FOR_DELIVERY" as OrderStatus,
      createdAt: updated.createdAt.toISOString(),
      totalPrice: Number(updated.totalPrice),
      customerName: updated.user?.name || "Customer",
      customerPhone: updatedAddressObj?.drop?.phone || updated.user?.phone || "",
      deliveryAddress: updatedAddressObj?.drop?.address || updated.address || "",
      trackingUrl: updatedAddressObj.trackingUrl,
      riderPhone: updatedAddressObj.riderPhone,
      riderName: updatedAddressObj.riderName,
      items: (updated.items || []).map((i) => ({
        id: i.id,
        nameAtOrder: i.nameAtOrder || i.menuItem?.name || "Item",
        quantity: i.quantity,
      })),
    }

    socketServer.emit("order:status_updated", formatted)
    socketServer.to(`order_${updated.id}`).emit("order:status_updated", formatted)
    socketServer.emit("kds:order_dispatched", {
      orderId: updated.id,
      trackingUrl: updatedAddressObj.trackingUrl,
      riderPhone: updatedAddressObj.riderPhone,
      riderName: updatedAddressObj.riderName,
    })
  }

  if (legacyBroadcast) {
    legacyBroadcast("REFRESH")
  }

  return updated
}
