import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getDatasourceUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  if (url.includes("connection_limit=")) return url
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}connection_limit=5&pool_timeout=10&connect_timeout=15`
}

const datasourceUrl = getDatasourceUrl()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
