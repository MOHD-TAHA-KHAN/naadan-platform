"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { placeOrder } from "@/actions/cart"
import dynamic from "next/dynamic"

const LocationPicker = dynamic(() => import("@/components/customer/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full rounded-xl bg-[#f7f3eb] border border-[#c0c9c0] animate-pulse flex items-center justify-center text-xs text-[#717972]">
      Loading OpenStreetMap...
    </div>
  ),
})

const KITCHEN_LAT = 21.1458
const KITCHEN_LNG = 79.0882

export function CheckoutForm() {
  const [isPending, startTransition] = useTransition()
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Enforce text address minimum length
    const trimmedAddress = address.trim()
    if (!trimmedAddress || trimmedAddress.length < 10) {
      setError("Please enter a complete delivery address (minimum 10 characters).")
      return
    }

    // Enforce real map selection (must not be empty and cannot be the Cloud Kitchen coordinates)
    const isKitchenCoords =
      lat === null ||
      lng === null ||
      (Math.abs(lat - KITCHEN_LAT) < 0.0001 && Math.abs(lng - KITCHEN_LNG) < 0.0001)

    if (isKitchenCoords) {
      setError("Please drop the pin on your exact delivery location.")
      return
    }

    setError(null)
    startTransition(async () => {
      const fullAddress = `${trimmedAddress} (Pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)})`
      const result = await placeOrder(fullAddress)
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
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Delivery Pin &amp; Cloud Kitchen
        </label>
        <LocationPicker
          onLocationChange={(selectedLat, selectedLng) => {
            setLat(selectedLat)
            setLng(selectedLng)
            if (error === "Please drop the pin on your exact delivery location.") {
              setError(null)
            }
          }}
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Full Delivery Address
        </label>
        <textarea
          id="address"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          required
          minLength={10}
          placeholder="Flat 402, Nilgiri Heights, Ramdaspeth, Nagpur - 440010"
          className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all resize-none"
        />
        <p className="text-[11px] text-[#717972] mt-1">Minimum 10 characters required for accurate delivery.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-[#93000a] bg-[#ffdad6] border border-[#ba1a1a]/20 px-3.5 py-2.5 rounded-lg">
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span>{error}</span>
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
