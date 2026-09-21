"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { placeOrder } from "@/actions/cart"

export function CheckoutForm() {
  const [isPending, startTransition] = useTransition()
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) {
      setError("Please enter your delivery address.")
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await placeOrder(address)
      if (result.error) {
        setError(result.error)
      } else if (result.orderId) {
        router.push(`/track/${result.orderId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#ffffff] rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <h3 className="font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
        Delivery Details
      </h3>

      <div>
        <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Full Delivery Address
        </label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          placeholder="Flat 402, Nilgiri Heights, Ramdaspeth, Nagpur - 440010"
          className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-[#93000a] bg-[#ffdad6] px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#033921] hover:bg-[#002211] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            Placing order...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[16px]">restaurant</span>
            Place Order
          </>
        )}
      </button>

      <p className="text-[10px] text-[#717972] text-center">
        By placing your order you agree to Naadan&apos;s terms of service.
      </p>
    </form>
  )
}
