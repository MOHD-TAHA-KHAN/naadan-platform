"use client"

import { useTransition, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { placeOrder, reverseGeocodeAction, calculateDeliveryTime, getDeliveryMetrics } from "@/actions/cart"
import { calculateDistance, validateDeliveryAddress, formatGranularAddress, validatePhoneNumber } from "@/lib/utils"
import { KITCHEN_COORDS, MAX_RADIUS_KM, FOOD_GST_PERCENT } from "@/lib/constants"
import dynamic from "next/dynamic"

export interface CartItemSummary {
  price: number
  quantity: number
  name?: string
}

interface CheckoutFormProps {
  items?: CartItemSummary[]
}

export function calculateDeliveryFee(distanceKm?: string | number | null): number {
  if (!distanceKm) return 40
  const dist = typeof distanceKm === "string" ? parseFloat(distanceKm) : distanceKm
  if (isNaN(dist) || dist <= 3) return 40
  return Math.min(100, Math.round(40 + (dist - 3) * 10))
}

const LocationPicker = dynamic(() => import("@/components/customer/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full rounded-xl bg-[#f7f3eb] border border-[#c0c9c0] animate-pulse flex items-center justify-center text-xs text-[#717972]">
      Loading Google Maps...
    </div>
  ),
})

export function CheckoutForm({ items = [] }: CheckoutFormProps) {
  const [isPending, startTransition] = useTransition()
  const [address, setAddress] = useState("")
  const [geocodedBaseAddress, setGeocodedBaseAddress] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [lat, setLat] = useState<number | null>(KITCHEN_COORDS.lat)
  const [lng, setLng] = useState<number | null>(KITCHEN_COORDS.lng)
  const [deliveryEta, setDeliveryEta] = useState<{
    travelMins: number
    prepMins: number
    totalEtaMins: number
    distanceKm: number | string
  } | null>(null)
  const [isCalculatingEta, setIsCalculatingEta] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const etaDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const addressValidation = validateDeliveryAddress(address, geocodedBaseAddress)
  const isAddressValid = addressValidation.isValid

  const phoneValidation = validatePhoneNumber(phoneNumber)
  const isPhoneValid = phoneValidation.isValid

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPhoneNumber(val)
    if (val.trim().length > 0) {
      const res = validatePhoneNumber(val)
      setPhoneError(res.isValid ? null : (res.error ?? "Invalid mobile number"))
    } else {
      setPhoneError(null)
    }
  }

  const handlePhoneBlur = () => {
    if (phoneNumber.trim().length > 0) {
      const res = validatePhoneNumber(phoneNumber)
      setPhoneError(res.isValid ? null : (res.error ?? "Invalid mobile number"))
    }
  }

  const isPinAtDefault =
    lat === null ||
    lng === null ||
    (lat === KITCHEN_COORDS.lat && lng === KITCHEN_COORDS.lng) ||
    (Math.abs(lat - KITCHEN_COORDS.lat) < 0.0001 && Math.abs(lng - KITCHEN_COORDS.lng) < 0.0001)

  const distanceKm =
    lat !== null && lng !== null
      ? calculateDistance(KITCHEN_COORDS.lat, KITCHEN_COORDS.lng, lat, lng)
      : null

  const isOutOfZone = distanceKm !== null && distanceKm > MAX_RADIUS_KM
  const isSubmitDisabled = isPending || isPinAtDefault || isOutOfZone || !isAddressValid || !isPhoneValid

  const itemTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const gstAmount = Math.round(itemTotal * (FOOD_GST_PERCENT / 100)) // 5% GST on food services
  const deliveryFee = deliveryEta ? calculateDeliveryFee(deliveryEta.distanceKm) : 40
  const grandTotal = itemTotal + gstAmount + deliveryFee

  // Handle location changes, debounced ETA calculation (400ms), and reverse geocoding
  const handleLocationChange = (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat)
    setLng(selectedLng)
    if (error === "Please drop the pin on your exact delivery location.") {
      setError(null)
    }

    if (etaDebounceRef.current) {
      clearTimeout(etaDebounceRef.current)
    }

    setIsCalculatingEta(true)
    setIsGeocoding(true)

    etaDebounceRef.current = setTimeout(async () => {
      try {
        const metrics = await getDeliveryMetrics(selectedLat, selectedLng)
        setDeliveryEta({
          travelMins: metrics.travelMins,
          prepMins: metrics.prepMins,
          totalEtaMins: metrics.totalEtaMins,
          distanceKm: metrics.distanceKm,
        })

        if (metrics.formattedAddress) {
          const fetchedAddress = metrics.formattedAddress
          setGeocodedBaseAddress(fetchedAddress)
          // Set address directly to the returned full string, preserving any user-prepended flat/house number
          setAddress((prev) => {
            if (!prev.trim()) {
              return fetchedAddress
            }
            if (geocodedBaseAddress && prev.includes(geocodedBaseAddress)) {
              return prev.replace(geocodedBaseAddress, fetchedAddress)
            }
            const flatPrefixMatch = prev.match(/^(?:flat|house|room|plot|apt|apartment|#|unit|villa|door|shop|no\.)\s*[^,]+,\s*/i)
            if (flatPrefixMatch) {
              return `${flatPrefixMatch[0]}${fetchedAddress}`
            }
            return fetchedAddress
          })
          // Clear any previous address error immediately
          setError(null)
        }
      } catch (err) {
        console.error("Error fetching delivery metrics:", err)
      } finally {
        setIsCalculatingEta(false)
        setIsGeocoding(false)
      }
    }, 400)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // 1. Enforce strict address validation
    const validation = validateDeliveryAddress(address, geocodedBaseAddress)
    if (!validation.isValid) {
      setError(validation.error || "Please enter a complete delivery address (minimum 15 characters).")
      return
    }

    // 2. Enforce strict mobile phone validation
    const currentPhoneValidation = validatePhoneNumber(phoneNumber)
    if (!currentPhoneValidation.isValid) {
      const err = currentPhoneValidation.error || "Please enter a valid 10-digit Indian mobile number."
      setPhoneError(err)
      setError(err)
      return
    }

    // 3. Check if map pin has moved from default
    if (isPinAtDefault) {
      alert("Please drop the pin on your exact delivery location.")
      setError("Please drop the pin on your exact delivery location.")
      return
    }

    // 4. Check 8km geofence
    if (isOutOfZone) {
      setError("Out of 8km delivery zone.")
      return
    }

    setError(null)
    startTransition(async () => {
      const cleanPhone = currentPhoneValidation.cleanedNumber || phoneNumber.trim()
      const payload = {
        pickup: KITCHEN_COORDS,
        drop: {
          lat: lat!,
          lng: lng!,
          address: address.trim(),
          phone: cleanPhone,
        },
        etaMins: deliveryEta?.totalEtaMins,
      }
      const result = await placeOrder(payload)
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
        <LocationPicker onLocationChange={handleLocationChange} />
        {deliveryEta && !isPinAtDefault && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e8f5e9] border border-[#38684c]/20 text-[#033921] text-xs font-semibold shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#033921]">schedule</span>
            <span>
              Estimated Delivery: {deliveryEta.totalEtaMins} mins ({deliveryEta.prepMins}m kitchen prep + {deliveryEta.travelMins}m travel, {deliveryEta.distanceKm} km)
            </span>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-[#717972]">
            Full Delivery Address
          </label>
          {isGeocoding && (
            <span className="text-[11px] text-[#7b5900] font-normal normal-case flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
              Fetching address from pin...
            </span>
          )}
        </div>
        <textarea
          id="address"
          name="address"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            if (error) {
              setError(null)
            }
          }}
          rows={3}
          required
          minLength={15}
          placeholder="Flat 402, Nilgiri Heights, Ramdaspeth, Nagpur - 440010"
          className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all resize-none"
        />
        {isGeocoding ? (
          <p className="text-[11px] text-[#7b5900] mt-1 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
            <span>Detecting street address from map pin...</span>
          </p>
        ) : !isAddressValid && (address.length > 0 || geocodedBaseAddress) ? (
          <p className="text-[11px] text-[#ba1a1a] mt-1 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">info</span>
            <span>{addressValidation.error || "Please retain the map-synced area details."}</span>
          </p>
        ) : isAddressValid ? (
          <p className="text-[11px] text-[#033921] mt-1 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            <span>Address synced from map. You can edit or prepend your Flat/House No.</span>
          </p>
        ) : (
          <p className="text-[11px] text-[#717972] mt-1">Minimum 15 characters required (e.g., Flat/House No., Street, Area).</p>
        )}
      </div>

      {/* Mobile Number for Delivery Partner Contact */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="phoneNumber" className="block text-xs font-semibold uppercase tracking-wider text-[#717972]">
            Mobile Number
          </label>
          <span className="text-[11px] text-[#717972] font-normal">
            For delivery partner contact
          </span>
        </div>
        <div className="relative flex items-center">
          <span className="inline-flex items-center px-3 py-2.5 rounded-l-lg border border-r-0 border-[#c0c9c0] bg-[#eae6df] text-xs font-semibold text-[#1c1c17] select-none">
            +91
          </span>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            required
            maxLength={13}
            placeholder="9876543210"
            className={`w-full px-3.5 py-2.5 rounded-r-lg border text-sm transition-all ${phoneError
                ? "border-[#ba1a1a] bg-[#fff8f7] text-[#1c1c17] focus:ring-2 focus:ring-[#ba1a1a]"
                : isPhoneValid
                  ? "border-[#38684c] bg-[#fdf9f1] text-[#1c1c17] focus:ring-2 focus:ring-[#033921]"
                  : "border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] focus:ring-2 focus:ring-[#7b5900]"
              } placeholder:text-[#717972]/60 focus:outline-none focus:border-transparent`}
          />
          {isPhoneValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-[#033921] pointer-events-none">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
          )}
        </div>
        {phoneError ? (
          <p className="text-[11px] text-[#ba1a1a] mt-1 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">error</span>
            <span>{phoneError}</span>
          </p>
        ) : isPhoneValid ? (
          <p className="text-[11px] text-[#033921] mt-1 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            <span>Valid 10-digit Indian mobile number</span>
          </p>
        ) : (
          <p className="text-[11px] text-[#717972] mt-1">
            Enter 10-digit number starting with 6, 7, 8, or 9
          </p>
        )}
      </div>

      {isOutOfZone ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#93000a] bg-[#ffdad6] border border-[#ba1a1a]/30 px-3.5 py-2.5 rounded-lg">
          <span className="material-symbols-outlined text-[16px] shrink-0">wrong_location</span>
          <span>Out of 8km delivery zone.</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-xs font-medium text-[#93000a] bg-[#ffdad6] border border-[#ba1a1a]/20 px-3.5 py-2.5 rounded-lg">
          <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      ) : isPinAtDefault ? (
        <div className="flex items-center gap-2 text-xs text-[#7b5900] bg-[#ffdea4]/30 border border-[#7b5900]/20 px-3.5 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[16px] shrink-0 text-[#7b5900]">pin_drop</span>
          <span>Please drop the pin on your exact delivery location on the map.</span>
        </div>
      ) : distanceKm !== null ? (
        <div className="flex items-center gap-2 text-xs text-[#033921] bg-[#baefcb]/40 border border-[#38684c]/20 px-3.5 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[16px] shrink-0 text-[#033921]">check_circle</span>
          <span>Delivery location is {distanceKm.toFixed(1)} km from kitchen (within {MAX_RADIUS_KM}km zone).</span>
        </div>
      ) : null}

      {/* Bill Summary */}
      {items.length > 0 && (
        <div className="bg-[#f7f3eb] rounded-xl p-4 border border-[#c0c9c0]/50 space-y-2 text-xs">
          <div className="flex justify-between text-[#414942]">
            <span>Item Total</span>
            <span className="font-medium text-[#002211]">₹{itemTotal}</span>
          </div>
          <div className="flex justify-between text-[#414942]">
            <span>Taxes &amp; Charges (5% GST)</span>
            <span className="font-medium text-[#002211]">₹{gstAmount}</span>
          </div>
          <div className="flex justify-between text-[#414942]">
            <span>Delivery Partner Fee</span>
            <span className="font-medium text-[#002211]">₹{deliveryFee}</span>
          </div>
          <div className="border-t border-[#c0c9c0]/40 pt-2 flex justify-between font-bold text-[#002211] text-sm">
            <span>Total Payable</span>
            <span className="text-[#033921]">₹{grandTotal}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#033921] hover:bg-[#002211] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? (
          <>
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            Placing order...
          </>
        ) : isOutOfZone ? (
          <>
            <span className="material-symbols-outlined text-[16px]">wrong_location</span>
            Out of 8km delivery zone.
          </>
        ) : isPinAtDefault ? (
          <>
            <span className="material-symbols-outlined text-[16px]">pin_drop</span>
            Pin Delivery Location
          </>
        ) : !isAddressValid ? (
          <>
            <span className="material-symbols-outlined text-[16px]">edit_location</span>
            Enter Complete Address
          </>
        ) : !isPhoneValid ? (
          <>
            <span className="material-symbols-outlined text-[16px]">call</span>
            Enter Valid Mobile Number
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


