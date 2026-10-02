"use client"

/**
 * Device Fingerprinting Utility for Guest/Unauthenticated User Tracking & Anti-Spam
 * Persists across sessions using localStorage and secure cookies.
 */

function generateSimpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

function getCanvasEntropy(): string {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = 160
    canvas.height = 40
    const ctx = canvas.getContext("2d")
    if (!ctx) return "nocanvas"
    ctx.textBaseline = "top"
    ctx.font = "14px 'Arial'"
    ctx.fillStyle = "#f60"
    ctx.fillRect(10, 5, 60, 20)
    ctx.fillStyle = "#069"
    ctx.fillText("NaadanDevice#2026", 12, 10)
    return generateSimpleHash(canvas.toDataURL())
  } catch {
    return "canvaserr"
  }
}

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") {
    return "server_rendered_session"
  }

  const STORAGE_KEY = "naadan_device_id"

  // 1. Check local storage
  const existingLocal = localStorage.getItem(STORAGE_KEY)
  if (existingLocal && existingLocal.length >= 16) {
    return existingLocal
  }

  // 2. Check cookie
  const match = document.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=([^;]*)`))
  if (match && match[1] && match[1].length >= 16) {
    localStorage.setItem(STORAGE_KEY, match[1])
    return match[1]
  }

  // 3. Generate deterministic entropy combined with high-resolution random ID
  const screenSignal = `${window.screen?.width}x${window.screen?.height}x${window.screen?.colorDepth}`
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  const lang = navigator.language || "en"
  const canvasHash = getCanvasEntropy()
  const randomPart = Math.random().toString(36).substring(2, 10)
  const timestampPart = Date.now().toString(36)

  const rawEntropy = `${screenSignal}|${tz}|${lang}|${canvasHash}|${navigator.userAgent}`
  const entropyHash = generateSimpleHash(rawEntropy)
  const fingerprint = `dev_${entropyHash}_${timestampPart}${randomPart}`

  // Persist to localStorage and 1-year cookie
  try {
    localStorage.setItem(STORAGE_KEY, fingerprint)
    document.cookie = `${STORAGE_KEY}=${fingerprint}; path=/; max-age=31536000; SameSite=Lax`
  } catch (err) {
    console.warn("Failed to persist device fingerprint:", err)
  }

  return fingerprint
}
