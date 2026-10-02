"use client"

import { useState, useTransition } from "react"
import { submitReview } from "@/actions/review"
import { addToCart } from "@/actions/cart"
import Link from "next/link"

export interface OrderHistoryItem {
  id: string
  menuItemId?: string
  name: string
  quantity: number
  price: number
  imageUrl?: string | null
}

export interface OrderHistoryRecord {
  id: string
  orderNumber: string
  totalPrice: number
  deliveryFee: number
  status: string
  rejectReason?: string | null
  address?: string | null
  customerPhone?: string | null
  distanceKm?: string | number | null
  createdAt: string | Date
  items: OrderHistoryItem[]
  review?: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date | string
  } | null
}

interface OrderHistoryProps {
  orders: OrderHistoryRecord[]
}

const statusStyles: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  PENDING: {
    label: "Order Received",
    bg: "bg-amber-100 border-amber-300",
    text: "text-amber-900",
    icon: "hourglass_top",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-blue-100 border-blue-300",
    text: "text-blue-900",
    icon: "verified",
  },
  PREPARING: {
    label: "Cooking in Handi",
    bg: "bg-orange-100 border-orange-300",
    text: "text-orange-900",
    icon: "skillet",
  },
  OUT_FOR_DELIVERY: {
    label: "Out For Delivery",
    bg: "bg-purple-100 border-purple-300",
    text: "text-purple-900",
    icon: "moped",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-100 border-emerald-300",
    text: "text-emerald-900",
    icon: "check_circle",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-100 border-rose-300",
    text: "text-rose-900",
    icon: "cancel",
  },
  REJECTED: {
    label: "Auto-Rejected",
    bg: "bg-red-100 border-red-300",
    text: "text-red-900",
    icon: "timer_off",
  },
}

export function OrderHistory({ orders: initialOrders }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderHistoryRecord[]>(initialOrders)
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL")
  const [isPending, startTransition] = useTransition()

  // Review submission state
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null)

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "ACTIVE") {
      return ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)
    }
    if (activeFilter === "COMPLETED") {
      return ["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status)
    }
    return true
  })

  function handleReorder(order: OrderHistoryRecord) {
    startTransition(async () => {
      let addedCount = 0
      for (const item of order.items) {
        if (item.menuItemId) {
          const res = await addToCart(item.menuItemId)
          if (res.success) addedCount++
        }
      }
      setReorderSuccess(`Added ${addedCount} dish(es) back to your cart!`)
      setTimeout(() => setReorderSuccess(null), 3500)
    })
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewingOrderId || rating === 0) {
      setReviewError("Please select a star rating.")
      return
    }
    setReviewError(null)

    startTransition(async () => {
      const result = await submitReview(reviewingOrderId, rating, comment)
      if (result.error) {
        setReviewError(result.error)
      } else {
        setReviewSuccess(true)
        setOrders((prev) =>
          prev.map((o) =>
            o.id === reviewingOrderId
              ? {
                  ...o,
                  review: {
                    id: "rev_" + Date.now(),
                    rating,
                    comment,
                    createdAt: new Date(),
                  },
                }
              : o
          )
        )
        setReviewingOrderId(null)
        setRating(0)
        setComment("")
        setTimeout(() => setReviewSuccess(false), 3000)
      }
    })
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl p-8 border border-[#f1ede6] shadow-sm">
        <span className="material-symbols-outlined text-[64px] text-[#c0c9c0] block mb-4">
          receipt_long
        </span>
        <h2 className="text-xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
          No orders placed yet
        </h2>
        <p className="text-[#717972] mt-2 mb-6">Explore our authentic earthenware delicacies and place your first feast!</p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#fcca66] text-[#755400] font-semibold hover:bg-[#f0bf5c] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">restaurant</span>
          Explore Menu
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[#f1ede6] p-1 rounded-xl">
          {(["ALL", "ACTIVE", "COMPLETED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === tab
                  ? "bg-[#033921] text-white shadow-xs"
                  : "text-[#414942] hover:text-[#002211]"
              }`}
            >
              {tab === "ALL" ? "All Orders" : tab === "ACTIVE" ? "Active" : "Past / Completed"}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#717972] font-mono">
          Showing {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
        </span>
      </div>

      {reorderSuccess && (
        <div className="flex items-center justify-between text-xs text-[#033921] bg-[#baefcb]/40 border border-[#38684c]/20 px-4 py-3 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
            <span>{reorderSuccess}</span>
          </div>
          <Link href="/cart" className="font-bold underline">
            Go to Cart →
          </Link>
        </div>
      )}

      {reviewSuccess && (
        <div className="flex items-center gap-2 text-xs text-[#38684c] bg-[#dff0d8] px-4 py-3 rounded-xl">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>Thank you! Your review has been published.</span>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const style = statusStyles[order.status] ?? statusStyles.PENDING
          const isActive = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(
            order.status
          )
          const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })

          return (
            <article
              key={order.id}
              className="bg-[#ffffff] rounded-2xl shadow-sm border border-[#f1ede6] overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#f1ede6] flex flex-wrap items-center justify-between gap-3 bg-[#fdfaf4]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm text-[#002211]">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.bg} ${style.text}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{style.icon}</span>
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#717972]">{formattedDate}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#717972] block">Total Amount</span>
                  <span className="text-lg font-bold text-[#002211] font-mono">
                    ₹{order.totalPrice.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Rejection notice banner if auto-rejected */}
              {order.status === "REJECTED" && (
                <div className="px-5 py-2.5 bg-[#ffdad6]/60 border-b border-[#ba1a1a]/20 flex items-center gap-2 text-xs text-[#93000a]">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>
                    {order.rejectReason ||
                      "Order automatically rejected: Kitchen preparation window timed out after 5 minutes."}
                  </span>
                </div>
              )}

              {/* Items Breakdown */}
              <div className="p-5 space-y-3">
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex min-w-[22px] h-[19px] rounded bg-[#033921] text-[#ffdea4] text-[11px] font-bold items-center justify-center">
                          {item.quantity}×
                        </span>
                        <span className="font-medium text-[#1c1c17]">{item.name}</span>
                      </div>
                      <span className="font-mono text-[#002211]">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery fee breakdown & address */}
                <div className="pt-3 border-t border-[#f1ede6] flex flex-wrap items-center justify-between text-xs text-[#717972] gap-2">
                  <div className="flex items-center gap-1.5 max-w-md">
                    <span className="material-symbols-outlined text-[15px] text-[#033921] shrink-0">
                      pin_drop
                    </span>
                    <span className="line-clamp-1">{order.address || "Address not recorded"}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span>Delivery Partner Fee:</span>
                    <span className="font-semibold text-[#002211]">₹{order.deliveryFee}</span>
                    {order.distanceKm && (
                      <span className="text-[10px] bg-[#f1ede6] px-1.5 py-0.5 rounded">
                        ({order.distanceKm} km)
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Display */}
                {order.review && (
                  <div className="bg-[#f7f3eb] rounded-xl p-3.5 mt-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`material-symbols-outlined text-[16px] ${
                            star <= order.review!.rating ? "text-[#fcca66]" : "text-[#c0c9c0]"
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    {order.review.comment && (
                      <p className="text-xs text-[#414942] italic">&ldquo;{order.review.comment}&rdquo;</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3.5 bg-[#faf8f4] border-t border-[#f1ede6] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isActive && (
                    <Link
                      href={`/track/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#033921] hover:bg-[#002211] text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px] animate-pulse">
                        navigation
                      </span>
                      <span>Live Track Delivery</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => handleReorder(order)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#c0c9c0] bg-white hover:bg-[#f1ede6] text-[#1c1c17] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">refresh</span>
                    <span>Order Again</span>
                  </button>
                </div>

                {order.status === "DELIVERED" && !order.review && (
                  <div>
                    {reviewingOrderId === order.id ? (
                      <form onSubmit={handleSubmitReview} className="space-y-2 mt-2 w-full max-w-md">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="cursor-pointer"
                            >
                              <span
                                className={`material-symbols-outlined text-[20px] ${
                                  star <= rating ? "text-[#fcca66]" : "text-[#c0c9c0]"
                                }`}
                              >
                                star
                              </span>
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Write a brief comment (optional)..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17]"
                        />
                        {reviewError && (
                          <p className="text-[11px] text-red-600">{reviewError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isPending}
                            className="px-3 py-1 rounded-lg bg-[#033921] text-white text-xs font-semibold cursor-pointer"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewingOrderId(null)}
                            className="px-3 py-1 rounded-lg border text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewingOrderId(order.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#7b5900] hover:underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">star_rate</span>
                        <span>Rate &amp; Review Feast</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
