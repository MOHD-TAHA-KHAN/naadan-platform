"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

const WS_URL = "ws://localhost:3001/ws"

export function useKdsSocket(initialActiveCount: number) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [connected, setConnected] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const prevCountRef = useRef(initialActiveCount)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function refresh() {
    startTransition(() => {
      router.refresh()
    })
    setLastRefreshed(new Date())
    setSecondsAgo(0)
  }

  useEffect(() => {
    let closed = false

    function connect() {
      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
        }

        ws.onclose = () => {
          setConnected(false)
          if (!closed && !reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null
              connect()
            }, 2_000)
          }
        }

        ws.onerror = () => {
          try { ws.close() } catch { /* ignore */ }
        }

        ws.onmessage = (event) => {
          if (typeof event.data === "string" && event.data === "REFRESH") {
            startTransition(() => {
              router.refresh()
            })
            setLastRefreshed(new Date())
            setSecondsAgo(0)
          }
        }
      } catch {
        if (!closed && !reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null
            connect()
          }, 2_000)
        }
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (wsRef.current) {
        try { wsRef.current.close() } catch { /* ignore */ }
        wsRef.current = null
      }
    }
  }, [router, startTransition])

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefreshed.getTime()) / 1_000))
    }, 1_000)
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
      const t = setTimeout(() => setNewOrderAlert(false), 4_000)
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
