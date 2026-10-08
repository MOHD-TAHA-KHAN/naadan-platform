import "dotenv/config"
import http from "node:http"
import express from "express"
import cors from "cors"
import { Server as SocketIOServer } from "socket.io"
import { WebSocketServer } from "ws"
import { prisma } from "./db/prisma"
import type { KdsTicket, OrderStatus } from "./types"
import deliveryRouter from "./routes/delivery"
import authRouter from "./routes/auth"

import {
  deviceFingerprintMiddleware,
  registerDeviceOrder,
  releaseDeviceOrder,
} from "./middleware/deviceFingerprintMiddleware"
import {
  initAutoRejectWorker,
  scheduleAutoReject,
  cancelAutoReject,
} from "./services/autoRejectService"
import {
  schedulePorterDispatch,
  cancelPorterDispatch,
  handlePorterRiderAssigned,
  setPorterSocketInstances,
} from "./services/porterDispatchService"

const PORT = Number(process.env.PORT ?? 5000)

function formatOrder(order: any): KdsTicket {
  let displayAddress = ""
  let customerPhone = ""
  let customerCoords: { lat: number; lng: number } | null = null
  let kitchenCoords = { lat: 21.1643, lng: 79.0772 } // Sadar, Nagpur

  try {
    const rawAddr = order.deliveryAddress || order.address
    const parsed = typeof rawAddr === "string" ? JSON.parse(rawAddr) : rawAddr

    displayAddress = parsed?.drop?.address || parsed?.address || rawAddr || ""
    customerPhone = parsed?.drop?.phone || parsed?.phone || order.user?.phone || ""
    if (parsed?.drop?.lat && parsed?.drop?.lng) {
      customerCoords = { lat: Number(parsed.drop.lat), lng: Number(parsed.drop.lng) }
    }
    if (parsed?.pickup?.lat && parsed?.pickup?.lng) {
      kitchenCoords = { lat: Number(parsed.pickup.lat), lng: Number(parsed.pickup.lng) }
    }
  } catch {
    displayAddress = order.deliveryAddress || order.address || "Address details unavailable"
  }

  return {
    id: order.id,
    orderNumber: order.id.slice(-6).toUpperCase(),
    status: order.status as OrderStatus,
    createdAt: typeof order.createdAt === "string" ? order.createdAt : order.createdAt.toISOString(),
    totalPrice: Number(order.totalPrice),
    deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : 40,
    rejectReason: order.rejectReason || undefined,
    deviceFingerprint: order.deviceFingerprint || undefined,
    customerName: order.user?.name || "Customer",
    customerPhone,
    deliveryAddress: displayAddress,
    address: displayAddress,
    customerCoords,
    kitchenCoords,
    trackingUrl: (order.address && typeof order.address === "string" && order.address.startsWith("{"))
      ? JSON.parse(order.address)?.trackingUrl || undefined
      : undefined,
    riderPhone: (order.address && typeof order.address === "string" && order.address.startsWith("{"))
      ? JSON.parse(order.address)?.riderPhone || undefined
      : undefined,
    riderName: (order.address && typeof order.address === "string" && order.address.startsWith("{"))
      ? JSON.parse(order.address)?.riderName || undefined
      : undefined,
    items: (order.items || []).map((i: any) => ({
      id: i.id,
      nameAtOrder: i.nameAtOrder || i.menuItem?.name || "Item",
      quantity: i.quantity,
      priceAtOrder: i.priceAtOrder ? Number(i.priceAtOrder) : undefined,
    })),
  }
}

async function fetchOrdersData() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  })

  const formatted = orders.map(formatOrder)
  const activeTickets = formatted.filter((o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status))
  const pastTickets = formatted.filter((o) => ["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status))

  return { orders: formatted, activeTickets, pastTickets }
}

const app = express()
app.use(cors({ origin: "*" }))
app.use(express.json())

// Apply device fingerprinting & anti-spam middleware globally
app.use(deviceFingerprintMiddleware)

app.use("/api/delivery", deliveryRouter)
app.use("/api/auth", authRouter)

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, port: PORT })
})

// REST endpoint for KDS and orders (supports ?active=true)
app.get("/api/orders", async (req, res) => {
  try {
    const { orders, activeTickets, pastTickets } = await fetchOrdersData()
    if (req.query.active === "true") {
      res.json({ orders: activeTickets, activeTickets, pastTickets })
      return
    }
    res.json({ orders, activeTickets, pastTickets })
  } catch (err) {
    console.error("[orders] GET /api/orders failed:", err)
    res.status(500).json({ error: "Failed to load orders." })
  }
})

app.get("/api/kds/orders", async (_req, res) => {
  try {
    const { orders, activeTickets, pastTickets } = await fetchOrdersData()
    res.json({ orders: activeTickets, activeTickets, pastTickets })
  } catch (err) {
    console.error("[kds] GET /api/kds/orders failed:", err)
    res.status(500).json({ error: "Failed to load KDS orders." })
  }
})

// Endpoint to fetch user order history by user ID or device fingerprint
app.get("/api/user/orders", async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string)
  const fingerprint = (req.query.fingerprint as string) || req.deviceFingerprint

  if (!userId && !fingerprint) {
    res.status(400).json({ error: "Missing userId or device fingerprint." })
    return
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(fingerprint ? [{ deviceFingerprint: fingerprint }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { menuItem: true } },
        review: true,
      },
    })

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.id.slice(-6).toUpperCase(),
      totalPrice: Number(o.totalPrice),
      deliveryFee: Number(o.deliveryFee),
      status: o.status,
      rejectReason: o.rejectReason,
      address: o.address,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        id: i.id,
        nameAtOrder: i.nameAtOrder,
        quantity: i.quantity,
        priceAtOrder: Number(i.priceAtOrder),
        imageUrl: i.menuItem?.imageUrl,
      })),
      review: o.review,
    }))

    res.json({ orders: formatted })
  } catch (err) {
    console.error("[user/orders] GET failed:", err)
    res.status(500).json({ error: "Failed to load user orders." })
  }
})

// Status update endpoints
const handleStatusUpdate = async (req: express.Request, res: express.Response) => {
  const rawId = req.params.id
  const orderId = Array.isArray(rawId) ? rawId[0] : rawId
  const status = req.body?.status
  if (!orderId || typeof status !== "string" || !status) {
    res.status(400).json({ error: "Missing order id or status." })
    return
  }

  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as never },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    })
    const formatted = formatOrder(updated)

    // When status changes from PENDING (e.g. accepted to CONFIRMED or cancelled/rejected):
    if (status !== "PENDING") {
      // 1. Cancel the 5-minute auto-reject countdown
      cancelAutoReject(orderId)

      // 2. Stop the persistent buzzing sound on KDS
      io.emit("kds:buzzer_stop", { orderId: updated.id })
    }

    // 3. Automated Porter logistics booking trigger:
    if (status === "CONFIRMED") {
      // Schedule automated Porter booking with 8-min delay (rider arrives right at 15m prep finish)
      schedulePorterDispatch(orderId)
    } else if (["CANCELLED", "REJECTED"].includes(status)) {
      // Cancel scheduled Porter booking if order is cancelled or rejected before dispatch
      cancelPorterDispatch(orderId)
    }

    // Release device lock if order is in a terminal status
    if (["DELIVERED", "CANCELLED", "REJECTED"].includes(status) && updated.deviceFingerprint) {
      releaseDeviceOrder(updated.deviceFingerprint, orderId)
    }

    // Broadcast status update via Socket.io
    io.emit("order:status_updated", formatted)
    io.to(`order_${updated.id}`).emit("order:status_updated", formatted)

    // Broadcast via legacy WS
    broadcast("REFRESH")

    res.json({ success: true, order: formatted })
  } catch (err) {
    console.error("[orders] Status update failed:", err)
    res.status(500).json({ error: "Failed to update order status." })
  }
}

app.patch("/api/orders/:id/status", handleStatusUpdate)
app.patch("/api/kds/orders/:id/status", handleStatusUpdate)

// Webhook endpoint to receive Porter rider allocation events
app.post("/api/webhooks/porter", async (req, res) => {
  const { event, order_id, request_id, driver_details, tracking_url, status } = req.body || {}
  console.log(`[Porter Webhook] Received event: ${event || status} for ${request_id || order_id}`)

  try {
    const updated = await handlePorterRiderAssigned({
      requestId: request_id,
      orderId: order_id,
      trackingUrl: tracking_url,
      driverDetails: driver_details,
    })

    if (!updated) {
      res.status(404).json({ error: "Order not found for Porter event." })
      return
    }

    res.json({ success: true, orderId: updated.id, status: updated.status })
  } catch (err) {
    console.error("[Porter Webhook] Error processing event:", err)
    res.status(500).json({ error: "Failed to process Porter webhook." })
  }
})

// Notification endpoint when order is created via server action or API
app.post("/api/orders/notify-created", async (req, res) => {
  const { orderId, deviceFingerprint } = req.body || {}
  if (!orderId) {
    res.status(400).json({ error: "Missing orderId" })
    return
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    })
    if (!order) {
      res.status(404).json({ error: "Order not found" })
      return
    }

    const formatted = formatOrder(order)

    // 1. Broadcast order created to KDS
    io.emit("order:created", formatted)

    // 2. Trigger persistent buzzing alert sound on admin KDS dashboard
    io.emit("kds:buzzer_start", { orderId: order.id, orderNumber: formatted.orderNumber })

    // 3. Schedule 5-minute auto-reject countdown worker
    scheduleAutoReject(order.id, order.createdAt)

    // 4. Register active order with device fingerprint
    const fp = deviceFingerprint || order.deviceFingerprint
    if (fp) {
      registerDeviceOrder(fp, order.id)
    }

    broadcast("REFRESH")

    res.json({ success: true, order: formatted })
  } catch (err) {
    console.error("[orders] notify-created failed:", err)
    res.status(500).json({ error: "Failed to broadcast order creation" })
  }
})

// Twilio webhook endpoints for automated voice callbacks
app.post("/api/webhooks/twilio/voice-twiml", (req, res) => {
  const shortId = (req.query.orderId as string)?.slice(-6)?.toUpperCase() || "ORDER"
  const twiml = `
    <Response>
      <Pause length="1"/>
      <Say voice="alice" language="en-IN">
        Hello. This is an automated notice from Naadan Cloud Kitchen Nagpur.
        Your order number ${shortId.split("").join(" ")} was automatically cancelled because our kitchen did not accept it within the required preparation window.
        Any payment has been initiated for immediate refund.
        We apologize for the inconvenience.
      </Say>
    </Response>
  `.trim()

  res.type("text/xml").send(twiml)
})

const server = http.createServer(app)

// Attach Socket.io with websocket + polling transports and CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
  transports: ["websocket", "polling"],
})

io.on("connection", (socket) => {
  console.log(`[socket.io] Client connected: ${socket.id}`)

  socket.on("join:order", (orderId: string) => {
    socket.join(`order_${orderId}`)
    console.log(`[socket.io] Socket ${socket.id} joined room order_${orderId}`)
  })

  socket.on("leave:order", (orderId: string) => {
    socket.leave(`order_${orderId}`)
  })

  socket.on("disconnect", (reason) => {
    console.log(`[socket.io] Client disconnected: ${socket.id} (${reason})`)
  })
})

// Legacy WS support for backwards compatibility
const wss = new WebSocketServer({ noServer: true })
server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/ws")) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req)
    })
  }
})
const clients = new Set<import("ws").WebSocket>()

wss.on("connection", (ws) => {
  clients.add(ws)
  ws.on("close", () => {
    clients.delete(ws)
  })
  ws.on("error", () => {
    clients.delete(ws)
  })
})

function broadcast(message: string) {
  for (const client of clients) {
    if (client.readyState === 1) {
      try {
        client.send(message)
      } catch {
        /* ignore */
      }
    }
  }
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[naadan-server] HTTP + Socket.IO listening on http://127.0.0.1:${PORT}`)
  setPorterSocketInstances(io, broadcast)
  // Initialize auto-reject worker for KDS orders with 5-minute timeout window
  initAutoRejectWorker(io, broadcast).catch((err) => {
    console.error("[naadan-server] Failed to initialize AutoRejectWorker:", err)
  })
})

