"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"

interface UseAdminBuzzerOptions {
  socketUrl?: string
  initialPendingOrderIds?: string[]
}

export function useAdminBuzzer({
  socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
  initialPendingOrderIds = [],
}: UseAdminBuzzerOptions = {}) {
  const [isBuzzing, setIsBuzzing] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [pendingOrders, setPendingOrders] = useState<string[]>(initialPendingOrderIds)

  const audioContextRef = useRef<AudioContext | null>(null)
  const isPlayingRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<Socket | null>(null)

  // Initialize or resume HTML5 Web Audio AudioContext
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx()
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().then(() => {
        setAudioEnabled(true)
      }).catch(() => {})
    }
    return audioContextRef.current
  }, [])

  // Explicit user gesture to enable audio and satisfy browser autoplay security policy
  const enableAudio = useCallback(() => {
    const ctx = getAudioContext()
    if (ctx) {
      ctx.resume().then(() => {
        setAudioEnabled(true)
        // Play a short pleasant test chirp to confirm
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      })
    }
  }, [getAudioContext])

  // Play a single buzzer pulse (dual-tone urgent alarm beep)
  const playPulse = useCallback(() => {
    const ctx = getAudioContext()
    if (!ctx || ctx.state !== "running") return

    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "square" // Piercing square wave for kitchen environments
      osc.frequency.setValueAtTime(880, now) // A5
      osc.frequency.setValueAtTime(740, now + 0.15) // F#5

      gain.gain.setValueAtTime(0.25, now)
      gain.gain.setValueAtTime(0.25, now + 0.25)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    } catch (err) {
      console.warn("Failed to play buzzer pulse:", err)
    }
  }, [getAudioContext])

  // Start continuous buzzer loop until stopped
  const startBuzzing = useCallback(() => {
    if (isPlayingRef.current) return
    isPlayingRef.current = true
    setIsBuzzing(true)

    // Play immediate pulse, then loop every 900ms
    playPulse()
    timerRef.current = setInterval(() => {
      if (isPlayingRef.current) {
        playPulse()
      }
    }, 900)
  }, [playPulse])

  // Stop buzzer loop
  const stopBuzzing = useCallback(() => {
    isPlayingRef.current = false
    setIsBuzzing(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Manage pending orders queue and buzzer trigger
  const addPendingOrder = useCallback((orderId: string) => {
    setPendingOrders((prev) => {
      if (prev.includes(orderId)) return prev
      const updated = [...prev, orderId]
      startBuzzing()
      return updated
    })
  }, [startBuzzing])

  const acknowledgeOrder = useCallback((orderId: string) => {
    setPendingOrders((prev) => {
      const updated = prev.filter((id) => id !== orderId)
      if (updated.length === 0) {
        stopBuzzing()
      }
      return updated
    })
  }, [stopBuzzing])

  // Connect to Socket.io for real-time buzzer push events
  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    })
    socketRef.current = socket

    socket.on("kds:buzzer_start", (data: { orderId: string }) => {
      if (data?.orderId) {
        addPendingOrder(data.orderId)
      }
    })

    socket.on("order:created", (order: { id: string; status: string }) => {
      if (order?.status === "PENDING" && order.id) {
        addPendingOrder(order.id)
      }
    })

    socket.on("kds:buzzer_stop", (data: { orderId: string }) => {
      if (data?.orderId) {
        acknowledgeOrder(data.orderId)
      }
    })

    socket.on("order:status_updated", (order: { id: string; status: string }) => {
      if (order?.id && order.status !== "PENDING") {
        acknowledgeOrder(order.id)
      }
    })

    return () => {
      socket.disconnect()
      stopBuzzing()
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [socketUrl, addPendingOrder, acknowledgeOrder, stopBuzzing])

  return {
    isBuzzing,
    audioEnabled,
    enableAudio,
    pendingOrderCount: pendingOrders.length,
    pendingOrders,
    stopBuzzing, // Allows manual mute
    acknowledgeOrder,
  }
}
