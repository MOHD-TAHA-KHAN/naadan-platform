export function timeInQueue(createdAt: Date | string, now = Date.now()): number {
  const start = typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime()
  return Math.max(0, now - start)
}

export function formatTimeInQueue(createdAt: Date | string, now = Date.now()): string {
  const mins = Math.floor(timeInQueue(createdAt, now) / 60_000)
  if (mins < 1) return "<1m"
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}
