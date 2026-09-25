export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"

export interface KdsTicketItem {
  id: string
  nameAtOrder: string
  quantity: number
}

export interface KdsTicket {
  id: string
  status: OrderStatus
  createdAt: string
  totalPrice: number
  customerName: string
  items: KdsTicketItem[]
}

export function isKnownOrderStatus(status: string): status is OrderStatus {
  return (
    status === "PENDING" ||
    status === "CONFIRMED" ||
    status === "PREPARING" ||
    status === "OUT_FOR_DELIVERY" ||
    status === "DELIVERED" ||
    status === "CANCELLED"
  )
}
