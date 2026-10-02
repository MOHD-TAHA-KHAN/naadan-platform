import type { Request, Response, NextFunction } from "express"
import crypto from "node:crypto"

// Augment express Request type to include deviceFingerprint
declare global {
  namespace Express {
    interface Request {
      deviceFingerprint?: string
    }
  }
}

/**
 * In-memory trackers for spam prevention & active order grouping.
 * In a multi-instance production environment, this can be backed by Redis.
 */
const activeOrdersByDevice = new Map<string, Set<string>>()
const requestTimestampsByDevice = new Map<string, number[]>()

// Anti-spam thresholds
const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000 // 2 minutes
const MAX_REQUESTS_PER_WINDOW = 5 // Max 5 checkout requests in 2 minutes
const MAX_ACTIVE_ORDERS_PER_DEVICE = 3 // Max 3 concurrent unfulfilled orders

export function generateFallbackFingerprint(req: Request): string {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1"
  const ua = req.headers["user-agent"] || "unknown-ua"
  return `fallback_${crypto.createHash("sha256").update(`${ip}-${ua}`).digest("hex").slice(0, 16)}`
}

/**
 * Express middleware to identify devices and enforce spam/multi-thread prevention.
 */
export function deviceFingerprintMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Extract fingerprint from header, cookie, or payload
  let fingerprint =
    (req.headers["x-device-fingerprint"] as string) ||
    req.body?.deviceFingerprint

  if (!fingerprint && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|; )naadan_device_id=([^;]*)/)
    if (match && match[1]) {
      fingerprint = match[1]
    }
  }

  // Fallback to IP + UA hash if unauthenticated client did not provide one
  if (!fingerprint || typeof fingerprint !== "string" || fingerprint.trim().length < 8) {
    fingerprint = generateFallbackFingerprint(req)
  } else {
    fingerprint = fingerprint.trim()
  }

  req.deviceFingerprint = fingerprint

  // Set response header for client transparency
  res.setHeader("X-Device-Fingerprint", fingerprint)

  // 2. If this is an order creation route, enforce rate-limiting and active-order limits
  if (req.method === "POST" && (req.path.includes("/orders") || req.path.includes("/checkout"))) {
    const now = Date.now()

    // Sliding window rate limit check
    const timestamps = (requestTimestampsByDevice.get(fingerprint) || []).filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    )

    if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      res.status(429).json({
        error: "Too many checkout requests from this device. Please wait a moment before trying again.",
        retryAfterSeconds: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - timestamps[0])) / 1000),
      })
      return
    }

    // Active pending order limit check
    const activeOrders = activeOrdersByDevice.get(fingerprint)
    if (activeOrders && activeOrders.size >= MAX_ACTIVE_ORDERS_PER_DEVICE) {
      res.status(429).json({
        error: `You already have ${activeOrders.size} active orders in progress. Please wait until your current orders are processed before placing another.`,
        activeOrderCount: activeOrders.size,
      })
      return
    }

    // Register this request timestamp
    timestamps.push(now)
    requestTimestampsByDevice.set(fingerprint, timestamps)
  }

  next()
}

/**
 * Register an active order under a device fingerprint.
 */
export function registerDeviceOrder(fingerprint: string, orderId: string) {
  if (!fingerprint || !orderId) return
  if (!activeOrdersByDevice.has(fingerprint)) {
    activeOrdersByDevice.set(fingerprint, new Set())
  }
  activeOrdersByDevice.get(fingerprint)!.add(orderId)
}

/**
 * Release an order once fulfilled, delivered, cancelled, or rejected.
 */
export function releaseDeviceOrder(fingerprint: string, orderId: string) {
  if (!fingerprint || !orderId) return
  const activeOrders = activeOrdersByDevice.get(fingerprint)
  if (activeOrders) {
    activeOrders.delete(orderId)
    if (activeOrders.size === 0) {
      activeOrdersByDevice.delete(fingerprint)
    }
  }
}

/**
 * Query active orders by fingerprint.
 */
export function getActiveOrdersForDevice(fingerprint: string): string[] {
  return Array.from(activeOrdersByDevice.get(fingerprint) || [])
}
