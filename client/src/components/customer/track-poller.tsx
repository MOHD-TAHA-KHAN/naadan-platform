"use client"

import { useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"

/** Statuses where polling must stop — order is in a terminal state */
const TERMINAL = new Set(["DELIVERED", "CANCELLED"])

const POLL_MS = 6_000

interface TrackPollerProps {
  /** Current order status passed from the server render each cycle */
  status: string
}

export function TrackPoller({ status }: TrackPollerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // If the order has already reached a terminal state, do nothing.
    if (TERMINAL.has(status)) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    function poll() {
      if (document.visibilityState === "hidden") return
      startTransition(() => router.refresh())
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") poll()
    }

    timerRef.current = setInterval(poll, POLL_MS)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
    // Re-run when status changes so we can clear the interval on terminal states.
  }, [status, router, startTransition])

  // This component renders no visible DOM — it is a pure behaviour island.
  return null
}
