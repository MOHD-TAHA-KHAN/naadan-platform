import { prisma } from "../db/prisma"
import type { KdsTicket, OrderStatus } from "../types"

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

export async function getKdsOrders() {
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
