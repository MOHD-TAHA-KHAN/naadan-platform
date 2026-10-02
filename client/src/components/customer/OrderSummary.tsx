"use client"

import { useCart } from "@/context/CartContext"

export function OrderSummary() {
  const { items, itemTotal, gstAmount, deliveryFee, grandTotal, distanceKm } = useCart()

  return (
    <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6 border border-[#f1ede6]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
          Order Summary
        </h3>
        {distanceKm !== null && (
          <span className="text-[10px] font-semibold font-mono bg-[#baefcb]/40 text-[#033921] px-2 py-0.5 rounded-full border border-[#38684c]/20">
            {distanceKm.toFixed(1)} km detected
          </span>
        )}
      </div>

      <div className="space-y-3 text-sm">
        {items.map((ci) => (
          <div key={ci.id} className="flex justify-between text-[#414942]">
            <span className="line-clamp-1">
              {ci.menuItem.name} × {ci.quantity}
            </span>
            <span className="font-medium text-[#002211] shrink-0 ml-2">
              ₹{(ci.price * ci.quantity).toFixed(0)}
            </span>
          </div>
        ))}

        <div className="border-t border-[#f1ede6] pt-3 flex justify-between text-[#414942]">
          <span>Item Total</span>
          <span className="font-medium text-[#002211]">₹{itemTotal.toFixed(0)}</span>
        </div>

        <div className="flex justify-between text-[#414942]">
          <span>Taxes &amp; Charges (5% GST)</span>
          <span className="font-medium text-[#002211]">₹{gstAmount.toFixed(0)}</span>
        </div>

        <div className="flex justify-between items-center text-[#414942]">
          <div className="flex items-center gap-1.5">
            <span>Delivery Partner Fee</span>
            {distanceKm !== null && distanceKm > 3 && (
              <span className="text-[10px] text-[#7b5900] bg-[#ffdea4]/40 px-1.5 py-0.5 rounded font-medium">
                Distance Tier
              </span>
            )}
          </div>
          <span className="font-medium text-[#002211] font-mono">₹{deliveryFee}</span>
        </div>

        <div className="border-t border-[#f1ede6] pt-3 flex justify-between items-baseline font-bold text-[#002211]">
          <span className="text-base">Total Payable</span>
          <span className="text-lg text-[#033921] font-mono">₹{grandTotal.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
