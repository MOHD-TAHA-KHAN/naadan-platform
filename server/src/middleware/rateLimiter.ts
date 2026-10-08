import type { Request, Response, NextFunction } from "express"

interface RateLimitOptions {
  windowMs?: number
  max?: number
  message?: string
}

const clientRequestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60 * 1000 // 1 minute
  const max = options.max ?? 20
  const message = options.message ?? "Too many requests. Please try again later."

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1"
    const token =
      (req.headers["authorization"] as string) ||
      (req.headers["x-user-id"] as string) ||
      (req.headers["x-device-fingerprint"] as string) ||
      ""
    const key = `${ip}:${token}`
    const now = Date.now()

    const record = clientRequestCounts.get(key)
    if (record && record.resetTime > now) {
      if (record.count >= max) {
        res.status(429).json({ error: message })
        return
      }
      record.count++
    } else {
      clientRequestCounts.set(key, { count: 1, resetTime: now + windowMs })
    }

    next()
  }
}
