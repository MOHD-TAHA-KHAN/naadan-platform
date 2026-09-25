"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function assertAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  return session
}

export async function updateInventoryStock(id: string, current: number) {
  await assertAdmin()
  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!item) return { error: "Item not found" }

    const status = current === 0 ? "OUT_OF_STOCK" : current < item.buffer ? "CRITICAL" : current < item.buffer * 1.5 ? "LOW_STOCK" : "IN_STOCK"

    await prisma.inventoryItem.update({
      where: { id },
      data: { current, status },
    })
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch {
    return { error: "Failed to update stock" }
  }
}

export async function updateInventoryBuffer(id: string, buffer: number) {
  await assertAdmin()
  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!item) return { error: "Item not found" }

    const status = item.current === 0 ? "OUT_OF_STOCK" : item.current < buffer ? "CRITICAL" : item.current < buffer * 1.5 ? "LOW_STOCK" : "IN_STOCK"

    await prisma.inventoryItem.update({
      where: { id },
      data: { buffer, status },
    })
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch {
    return { error: "Failed to update buffer" }
  }
}

export async function addInventoryItem(data: { name: string; unit: string; current: number; buffer: number; supplier?: string }) {
  await assertAdmin()
  try {
    const status = data.current === 0 ? "OUT_OF_STOCK" : data.current < data.buffer ? "CRITICAL" : data.current < data.buffer * 1.5 ? "LOW_STOCK" : "IN_STOCK"

    await prisma.inventoryItem.create({
      data: { ...data, status },
    })
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch {
    return { error: "Failed to add item" }
  }
}

export async function deleteInventoryItem(id: string) {
  await assertAdmin()
  try {
    await prisma.inventoryItem.delete({ where: { id } })
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch {
    return { error: "Failed to delete item" }
  }
}

export async function getInventoryStats() {
  await assertAdmin()
  try {
    const stats = await prisma.inventoryItem.groupBy({
      by: ['supplier'],
      _count: {
        id: true,
      },
      where: {
        supplier: {
          not: null,
        },
      },
    })

    const statusCounts = await prisma.inventoryItem.groupBy({
      by: ['supplier', 'status'],
      _count: {
        id: true,
      },
      where: {
        supplier: {
          not: null,
        },
      },
    })

    const utilizationData = await prisma.inventoryItem.findMany({
      select: {
        supplier: true,
        current: true,
        buffer: true,
      },
      where: {
        supplier: {
          not: null,
        },
      },
    })

    const results = stats.map((stat) => {
      const supplier = stat.supplier!
      const totalSkus = stat._count.id

      const criticalCount = statusCounts
        .filter((s) => s.supplier === supplier && s.status === 'CRITICAL')
        .reduce((sum, s) => sum + s._count.id, 0)

      const lowStockCount = statusCounts
        .filter((s) => s.supplier === supplier && s.status === 'LOW_STOCK')
        .reduce((sum, s) => sum + s._count.id, 0)

      const supplierItems = utilizationData.filter((item) => item.supplier === supplier)
      const totalCurrent = supplierItems.reduce((sum, item) => sum + item.current, 0)
      const totalBuffer = supplierItems.reduce((sum, item) => sum + item.buffer, 0)
      const utilization = totalBuffer > 0 ? (totalCurrent / totalBuffer) * 100 : 0

      return {
        supplier,
        totalSkus,
        criticalItems: criticalCount,
        lowStockItems: lowStockCount,
        utilization: utilization.toFixed(1),
      }
    })

    return { success: true, data: results }
  } catch {
    return { error: "Failed to fetch inventory stats" }
  }
}