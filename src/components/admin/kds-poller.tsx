"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

const POLL_MS = 8_000

interface KdsPollerProps {
  /** Current active-order count from the server render — used to detect new arrivals */
  initialActiveCount: number
}

export function KdsPoller({ initialActiveCount }: KdsPollerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [newOrderAlert, setNewOrderAlert] = useState(false)

  // Track active count across refreshes via a data-attribute written by the
  // server-rendered header (see admin orders page).
  const prevCountRef = useRef(initialActiveCount)

  // ── Polling interval ────────────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    function poll() {
      // Don't poll while the tab is hidden — resume when it comes back.
      if (document.visibilityState === "hidden") return

      startTransition(() => {
        router.refresh()
      })
      setLastRefreshed(new Date())
      setSecondsAgo(0)
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        // Tab just became visible — fire an immediate refresh, then resume interval.
        poll()
      }
    }

    timer = setInterval(poll, POLL_MS)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [router, startTransition])

  // ── "Seconds since last refresh" ticker ────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefreshed.getTime()) / 1_000))
    }, 1_000)
    return () => clearInterval(tick)
  }, [lastRefreshed])

  // ── New-order bell: compare active count against what the server just sent ──
  // The server re-renders the page on router.refresh(); the new initialActiveCount
  // prop will be passed down by the updated Server Component.  We detect an
  // increase and flash the alert for 4 s.
  useEffect(() => {
    if (initialActiveCount > prevCountRef.current) {
      setNewOrderAlert(true)
      // Play a soft Web Audio beep (no external file needed)
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
        // AudioContext unavailable (e.g. server-side) — silent fail
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

  return (
    <div className="flex items-center gap-3">
      {/* New-order alert badge */}
      {newOrderAlert && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ba1a1a] text-white text-[10px] font-semibold uppercase tracking-wider animate-bounce">
          <span className="material-symbols-outlined text-[13px]">notifications_active</span>
          New order!
        </span>
      )}

      {/* Live pulse + sync time */}
      <div className="flex items-center gap-1.5 bg-[#f1ede6] px-3 py-1.5 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38684c] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38684c]" />
        </span>
        <span className="text-[11px] font-semibold text-[#002211]">Live</span>
        <span className="text-[10px] text-[#717972]">· synced {refreshLabel}</span>
      </div>

      {/* Manual refresh button */}
      <button
        onClick={() => {
          startTransition(() => router.refresh())
          setLastRefreshed(new Date())
          setSecondsAgo(0)
        }}
        title="Force refresh"
        className="w-7 h-7 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e0] flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-outlined text-[15px] text-[#414942]">sync</span>
      </button>
    </div>
  )
}
