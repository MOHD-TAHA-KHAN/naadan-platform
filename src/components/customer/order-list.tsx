"use client"

import { useState } from "react"
import { useTransition } from "react"
import { submitReview } from "@/actions/review"

interface OrderListProps {
  orders: Array<{
    id: string
    totalPrice: number
    status: string
    createdAt: Date
    items: Array<{
      id: string
      nameAtOrder: string
      quantity: number
      priceAtOrder: number
    }>
    review: {
      id: string
      rating: number
      comment: string | null
      createdAt: Date
    } | null
  }>
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

export function OrderList({ orders }: OrderListProps) {
  const [isPending, startTransition] = useTransition()
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleStartReview(orderId: string) {
    setReviewingOrderId(orderId)
    setRating(0)
    setComment("")
    setError(null)
    setSuccess(false)
  }

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewingOrderId || rating === 0) {
      setError("Please select a rating.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await submitReview(reviewingOrderId, rating, comment)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setReviewingOrderId(null)
        setRating(0)
        setComment("")
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="material-symbols-outlined text-[64px] text-[#c0c9c0] block mb-4">receipt_long</span>
        <h2 className="text-xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
          No orders yet
        </h2>
        <p className="text-[#717972] mt-2 mb-6">Start ordering delicious Kerala cuisine!</p>
        <a
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#fcca66] text-[#755400] font-semibold hover:bg-[#f0bf5c] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">restaurant</span>
          Explore Menu
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-2 text-xs text-[#38684c] bg-[#dff0d8] px-4 py-3 rounded-lg">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Review submitted successfully!
        </div>
      )}

      {orders.map((order) => (
        <div key={order.id} className="bg-[#ffffff] rounded-2xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-semibold text-[#002211]">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[order.status] ?? "bg-gray-100 text-gray-800"}`}
                >
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-[#717972]">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <p className="font-bold text-[#002211]">₹{Number(order.totalPrice).toFixed(0)}</p>
          </div>

          <div className="space-y-2 mb-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-[#414942]">
                <span>{item.nameAtOrder} × {item.quantity}</span>
                <span className="font-medium text-[#002211]">
                  ₹{(Number(item.priceAtOrder) * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Review Section */}
          {order.review ? (
            <div className="bg-[#f7f3eb] rounded-lg p-4 mt-4">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`material-symbols-outlined text-[18px] ${star <= order.review.rating ? "text-[#fcca66]" : "text-[#c0c9c0]"}`}
                  >
                    {star <= order.review.rating ? "star" : "star_border"}
                  </span>
                ))}
              </div>
              {order.review.comment && (
                <p className="text-sm text-[#414942]">{order.review.comment}</p>
              )}
              <p className="text-[10px] text-[#717972] mt-2">
                Reviewed on {new Date(order.review.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          ) : order.status === "DELIVERED" ? (
            reviewingOrderId === order.id ? (
              <form onSubmit={handleSubmitReview} className="bg-[#f7f3eb] rounded-lg p-4 mt-4">
                <div className="mb-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-2">
                    Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <span
                          className={`material-symbols-outlined text-[24px] ${star <= rating ? "text-[#fcca66]" : "text-[#c0c9c0]"}`}
                        >
                          {star <= rating ? "star" : "star_border"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="comment" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-2">
                    Comment (optional)
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Share your experience..."
                    className="w-full px-3 py-2 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-[#93000a] bg-[#ffdad6] px-3 py-2 rounded-lg mb-3">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#033921] hover:bg-[#002211] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewingOrderId(null)}
                    className="px-4 py-2 rounded-lg border border-[#c0c9c0] text-sm font-medium text-[#414942] hover:bg-[#f1ede6] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => handleStartReview(order.id)}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#fcca66] hover:bg-[#f0bf5c] px-4 py-2 text-sm font-semibold text-[#755400] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">star</span>
                Leave a Review
              </button>
            )
          ) : null}
        </div>
      ))}
    </div>
  )
}
