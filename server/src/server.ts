import "dotenv/config"
import http from "node:http"
import express from "express"
import { WebSocketServer } from "ws"
import { prisma } from "./db/prisma"
import type { KdsTicket, OrderStatus } from "./types"

const PORT = Number(process.env.PORT ?? 3001)


function toTicket(order: {
  id: string
  status: string
  createdAt: Date
  totalPrice: { toString(): string } | number
  user: { name: string }
  items: { id: string; nameAtOrder: string; quantity: number }[]
}): KdsTicket {
  return {
    id: order.id,
    status: order.status as OrderStatus,
    createdAt: order.createdAt.toISOString(),
    totalPrice: Number(order.totalPrice),
    customerName: order.user.name,
    items: order.items.map((i) => ({
      id: i.id,
      nameAtOrder: i.nameAtOrder,
      quantity: i.quantity,
    })),
  }
}

async function getKdsOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
  })

  const activeTickets = orders
    .filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status))
    .map(toTicket)
  const pastTickets = orders
    .filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status))
    .map(toTicket)

  return { activeTickets, pastTickets }
}

async function updateOrderStatus(orderId: string, status: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: status as never },
    })
    return { success: true }
  } catch {
    return { error: "Failed to update order status." }
  }
}

const app = express()
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

app.get("/api/kds/orders", async (_req, res) => {
  try {
    const payload = await getKdsOrders()
    res.json(payload)
  } catch (err) {
    console.error("[kds] GET /api/kds/orders failed:", err)
    res.status(500).json({ error: "Failed to load KDS orders." })
  }
})

app.patch("/api/kds/orders/:id/status", async (req, res) => {
  const orderId = req.params.id
  const status = req.body?.status
  if (typeof status !== "string" || !status) {
    res.status(400).json({ error: "Missing status." })
    return
  }
  const result = await updateOrderStatus(orderId, status)
  if ("error" in result && result.error) {
    res.status(500).json(result)
    return
  }
  res.json(result)
  broadcast("REFRESH")
})

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: "/ws" })

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
      try { client.send(message) } catch { /* ignore */ }
    }
  }
}

server.listen(3001, "0.0.0.0", () => {
  console.log("[naadan-server] HTTP + WS listening on http://127.0.0.1:3001");
});
