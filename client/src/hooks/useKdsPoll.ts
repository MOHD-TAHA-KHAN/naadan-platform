"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

const POLL_MS = 8_000

export function useKdsPoll(initialActiveCount: number) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const prevCountRef = useRef(initialActiveCount)

  function refresh() {
    startTransition(() => {
      router.refresh()
    })
    setLastRefreshed(new Date())
    setSecondsAgo(0)
  }

  useEffect(() => {
    function poll() {
      if (document.visibilityState === "hidden") return
      startTransition(() => {
        router.refresh()
      })
      setLastRefreshed(new Date())
      setSecondsAgo(0)
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") poll()
    }

    const timer = setInterval(poll, POLL_MS)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
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

  return { refreshLabel, newOrderAlert, refresh }
}
