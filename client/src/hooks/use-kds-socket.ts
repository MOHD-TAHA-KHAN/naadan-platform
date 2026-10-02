"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL && !process.env.NEXT_PUBLIC_SOCKET_URL.includes("3000")
    ? process.env.NEXT_PUBLIC_SOCKET_URL
    : "http://localhost:5000"

export function useKdsSocket(initialActiveCount: number) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [connected, setConnected] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const prevCountRef = useRef(initialActiveCount)
  const socketRef = useRef<Socket | null>(null)

  function refresh() {
    startTransition(() => {
      router.refresh()
    })
    setLastRefreshed(new Date())
    setSecondsAgo(0)
  }

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    })
    socketRef.current = socket

    socket.on("connect", () => {
      setConnected(true)
      setLastRefreshed(new Date())
      setSecondsAgo(0)
    })

    socket.on("disconnect", () => {
      setConnected(false)
    })

    socket.on("connect_error", () => {
      setConnected(false)
    })

    socket.on("order:created", () => {
      refresh()
      setNewOrderAlert(true)
      setTimeout(() => setNewOrderAlert(false), 4000)
    })

    socket.on("order:status_updated", () => {
      refresh()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [router, startTransition])

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefreshed.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [lastRefreshed])

  useEffect(() => {
    if (initialActiveCount > prevCountRef.current) {
      setNewOrderAlert(true)
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.35)
      } catch {
        // AudioContext unavailable
      }
      const t = setTimeout(() => setNewOrderAlert(false), 4000)
      return () => clearTimeout(t)
    }
    prevCountRef.current = initialActiveCount
  }, [initialActiveCount])

  const refreshLabel =
    secondsAgo < 5
      ? "just now"
      : secondsAgo < 60
        ? `${secondsAgo}s ago`
        : `${Math.floor(secondsAgo / 60)}m ago`

  return { connected, refreshLabel, newOrderAlert, refresh }
}

