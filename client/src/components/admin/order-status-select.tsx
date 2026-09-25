"use client"

import { OrderStatusToggle } from "@/components/features/kds"
import type { OrderStatus } from "@/components/features/kds/types"

export function OrderStatusSelect({
  orderId,
  currentStatus,
  initialStatus,
}: {
  orderId: string
  currentStatus?: OrderStatus | string
  initialStatus?: OrderStatus | string
}) {
  const status = (currentStatus ?? initialStatus) as OrderStatus
  return <OrderStatusToggle orderId={orderId} initialStatus={status} />
}
