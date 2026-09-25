import { OrderHistoryTable as FeatureOrderHistoryTable } from "@/components/features/history/OrderHistoryTable"
import type { KdsTicket } from "@server"

export function OrderHistoryTable({ tickets }: { tickets: KdsTicket[] }) {
  return <FeatureOrderHistoryTable tickets={tickets as any} />
}
