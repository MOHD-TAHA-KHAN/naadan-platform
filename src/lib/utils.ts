export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export function formatPrice(amount: number | string) {
  return `₹${Number(amount).toFixed(0)}`
}

export function formatOrderId(id: string) {
  return `ND-${id.slice(-6).toUpperCase()}`
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }
  return map[status] ?? "bg-gray-100 text-gray-800"
}

export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  }
  return map[status] ?? status
}
