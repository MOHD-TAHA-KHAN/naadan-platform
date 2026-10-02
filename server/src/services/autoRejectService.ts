import { Server as SocketIOServer } from "socket.io"
import { prisma } from "../db/prisma"
import { triggerCustomerVoiceCall } from "./twilioVoiceService"
import { releaseDeviceOrder } from "../middleware/deviceFingerprintMiddleware"
import type { OrderStatus } from "../types"

// Default auto-reject timeout is 5 minutes (300,000 ms)
const AUTO_REJECT_TIMEOUT_MS = Number(process.env.AUTO_REJECT_TIMEOUT_MS || 5 * 60 * 1000)

interface ActiveTimer {
  timeout: NodeJS.Timeout
  expiresAt: number
}

const activeTimers = new Map<string, ActiveTimer>()
let socketServer: SocketIOServer | null = null
let legacyBroadcast: ((msg: string) => void) | null = null

export function setSocketInstances(io: SocketIOServer, broadcast: (msg: string) => void) {
  socketServer = io
  legacyBroadcast = broadcast
}

/**
 * Executes order rejection when the 5-minute timeout expires.
 */
export async function executeAutoReject(orderId: string) {
  // Clear any registered timer
  if (activeTimers.has(orderId)) {
    clearTimeout(activeTimers.get(orderId)!.timeout)
    activeTimers.delete(orderId)
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    })

    if (!order) return

    // Only reject if still in PENDING (Order Received) status
    if (order.status !== "PENDING") {
      return
    }

    console.log(`[AutoReject] Order #${order.id.slice(-6).toUpperCase()} exceeded 5m threshold without acceptance. Auto-rejecting...`)

    // Update order status to REJECTED with reason
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REJECTED" as OrderStatus,
        rejectReason: "Order automatically rejected - Kitchen timed out after 5 minutes without acceptance.",
      },
      include: {
        user: { select: { name: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    })

    // Release device lock if order was tracked
    if (order.deviceFingerprint) {
      releaseDeviceOrder(order.deviceFingerprint, orderId)
    }

    // Parse customer phone number
    let customerPhone = order.user?.phone || ""
    try {
      const parsedAddr = typeof order.address === "string" ? JSON.parse(order.address) : order.address
      if (parsedAddr?.drop?.phone) {
        customerPhone = parsedAddr.drop.phone
      }
    } catch {
      // ignore
    }

    // Trigger Twilio Automated Voice Call to customer
    if (customerPhone) {
      triggerCustomerVoiceCall({
        toPhone: customerPhone,
        orderId: order.id,
        customerName: order.user?.name || "Customer",
        reason: "Kitchen did not accept order within 5 minutes",
      }).catch((err) => {
        console.error("[AutoReject] Voice call trigger error:", err)
      })
    }

    // Notify connected clients via Socket.io
    if (socketServer) {
      const formatted = {
        id: updated.id,
        orderNumber: updated.id.slice(-6).toUpperCase(),
        status: "REJECTED" as OrderStatus,
        createdAt: updated.createdAt.toISOString(),
        totalPrice: Number(updated.totalPrice),
        customerName: updated.user?.name || "Customer",
        customerPhone,
        rejectReason: updated.rejectReason,
        items: updated.items.map((i) => ({
          id: i.id,
          nameAtOrder: i.nameAtOrder || i.menuItem?.name || "Item",
          quantity: i.quantity,
          priceAtOrder: Number(i.priceAtOrder),
        })),
      }

      // Stop admin buzzer for this order
      socketServer.emit("kds:buzzer_stop", { orderId: updated.id })
      socketServer.emit("order:status_updated", formatted)
      socketServer.to(`order_${updated.id}`).emit("order:status_updated", formatted)
    }

    if (legacyBroadcast) {
      legacyBroadcast("REFRESH")
    }
  } catch (err) {
    console.error(`[AutoReject] Error executing auto-reject for order ${orderId}:`, err)
  }
}

/**
 * Schedule an auto-reject countdown for a newly placed or pending order.
 */
export function scheduleAutoReject(orderId: string, createdAt: Date | string) {
  // Cancel any existing timer for this order
  cancelAutoReject(orderId)

  const createdTime = new Date(createdAt).getTime()
  const now = Date.now()
  const elapsed = now - createdTime
  const remaining = Math.max(0, AUTO_REJECT_TIMEOUT_MS - elapsed)

  if (remaining <= 0) {
    // Already past 5 minutes, execute immediately
    executeAutoReject(orderId)
    return
  }

  const timeout = setTimeout(() => {
    executeAutoReject(orderId)
  }, remaining)

  activeTimers.set(orderId, {
    timeout,
    expiresAt: now + remaining,
  })

  console.log(`[AutoReject] Scheduled 5m timer for order #${orderId.slice(-6).toUpperCase()} (${Math.round(remaining / 1000)}s remaining)`)
}

/**
 * Cancel the auto-reject timer (e.g., when the admin clicks "Accept Order").
 */
export function cancelAutoReject(orderId: string) {
  const active = activeTimers.get(orderId)
  if (active) {
    clearTimeout(active.timeout)
    activeTimers.delete(orderId)
    console.log(`[AutoReject] Timer cancelled for order #${orderId.slice(-6).toUpperCase()} (Order Accepted or Status Changed)`)
  }
}

/**
 * Initialize background worker:
 * 1. Scans existing PENDING orders in DB and schedules timers.
 * 2. Runs periodic sweep every 30 seconds to catch any missed or restarted orders.
 */
export async function initAutoRejectWorker(io: SocketIOServer, broadcast: (msg: string) => void) {
  setSocketInstances(io, broadcast)

  async function checkPendingOrders() {
    try {
      const pendingOrders = await prisma.order.findMany({
        where: { status: "PENDING" },
        select: { id: true, createdAt: true },
      })

      for (const order of pendingOrders) {
        if (!activeTimers.has(order.id)) {
          scheduleAutoReject(order.id, order.createdAt)
        }
      }
    } catch (err) {
      console.error("[AutoRejectWorker] Error scanning pending orders:", err)
    }
  }

  // Initial scan on boot
  await checkPendingOrders()

  // Periodic safety check every 30s
  setInterval(checkPendingOrders, 30_000)
  console.log("[AutoRejectWorker] Active and monitoring KDS pending orders with 5-minute timeout window.")
}
