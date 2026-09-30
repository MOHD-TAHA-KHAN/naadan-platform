import "dotenv/config"
import http from "node:http"
import express from "express"
import cors from "cors"
import { Server as SocketIOServer } from "socket.io"
import { WebSocketServer } from "ws"
import { prisma } from "./db/prisma"
import type { KdsTicket, OrderStatus } from "./types"
import deliveryRouter from "./routes/delivery"

const PORT = Number(process.env.PORT ?? 5000)

function formatOrder(order: any): KdsTicket {
  let displayAddress = ""
  let customerPhone = ""
  let customerCoords: { lat: number; lng: number } | null = null
  let kitchenCoords = { lat: 21.1594, lng: 79.0825 } // Sadar, Nagpur

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
    customerName: order.user?.name || "Customer",
    customerPhone,
    deliveryAddress: displayAddress,
    address: displayAddress,
    customerCoords,
    kitchenCoords,
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
  const activeTickets = formatted.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status))
  const pastTickets = formatted.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status))

  return { orders: formatted, activeTickets, pastTickets }
}

const app = express()
app.use(cors({ origin: "*" }))
app.use(express.json())
app.use("/api/delivery", deliveryRouter)

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

    // Broadcast via Socket.io
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

// Notification endpoint when order is created via server action or API
app.post("/api/orders/notify-created", async (req, res) => {
  const { orderId } = req.body || {}
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
    io.emit("order:created", formatted)
    broadcast("REFRESH")

    res.json({ success: true, order: formatted })
  } catch (err) {
    console.error("[orders] notify-created failed:", err)
    res.status(500).json({ error: "Failed to broadcast order creation" })
  }
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
})

