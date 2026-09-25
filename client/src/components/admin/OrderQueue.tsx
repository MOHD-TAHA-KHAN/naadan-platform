import { OrderQueue as FeatureOrderQueue } from "@/components/features/kds/OrderQueue"
import type { KdsTicket } from "@server"

export function OrderQueue({ tickets }: { tickets: KdsTicket[] }) {
  return <FeatureOrderQueue tickets={tickets as any} />
}
