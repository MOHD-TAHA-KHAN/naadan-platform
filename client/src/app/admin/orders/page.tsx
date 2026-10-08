"use client"

import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { KdsHeader } from "@/components/admin/KdsHeader"
import { KdsBoardIntro } from "@/components/admin/KdsBoardIntro"
import { OrderQueue } from "@/components/admin/OrderQueue"
import type { KdsTicket } from "@server"
import dynamic from "next/dynamic"

const OrderHistoryTable = dynamic(
  () => import("@/components/admin/OrderHistoryTable").then((m) => m.OrderHistoryTable),
)

export default function AdminOrdersPage() {
  const [activeTickets, setActiveTickets] = useState<KdsTicket[]>([])
  const [pastTickets, setPastTickets] = useState<KdsTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 1. Dual Hydration: Initial REST fetch on mount to immediately populate KDS board
  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true)
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("3000")
            ? process.env.NEXT_PUBLIC_API_URL
            : "http://localhost:5000"

        const res = await fetch(`${backendUrl}/api/orders?active=true`)
        if (res.ok) {
          const data = await res.json()
          const active = data.orders || data.activeTickets || []
          setActiveTickets(active)
          if (data.pastTickets) {
            setPastTickets(data.pastTickets)
          }
        }
      } catch (err) {
        console.error("[admin/orders] Failed to load initial KDS orders:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // 2. Dual Hydration: Socket.io connection targeting backend port (http://localhost:5000)
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL && !process.env.NEXT_PUBLIC_SOCKET_URL.includes("3000")
        ? process.env.NEXT_PUBLIC_SOCKET_URL
        : "http://localhost:5000"

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
    })

    // Add new tickets to 'Order Received' (PENDING) column
    socket.on("order:created", (order: KdsTicket) => {
      setActiveTickets((prev) => [order, ...prev.filter((o) => o.id !== order.id)])
    })

    // Advance existing tickets across the board when kitchen updates status
    socket.on("order:status_updated", (order: KdsTicket) => {
      setActiveTickets((prev) =>
        prev.map((o) => (o.id === order.id ? order : o))
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin/orders" staffName="Kitchen Staff" />
      <div className="pl-64 flex-1">
        <KdsHeader activeCount={activeTickets.length} />
        <main className="pt-16 p-6 min-h-screen">
          <KdsBoardIntro />
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#717972]">
              <span className="material-symbols-outlined text-[32px] text-[#033921] animate-spin mb-2">
                progress_activity
              </span>
              <p className="text-sm font-semibold">Loading KDS tickets...</p>
            </div>
          ) : (
            <>
              <OrderQueue tickets={activeTickets} />
              <OrderHistoryTable tickets={pastTickets} />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
