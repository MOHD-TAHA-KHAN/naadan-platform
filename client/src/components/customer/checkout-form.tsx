"use client"

import { useTransition, useState, useRef, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { placeOrder, getDeliveryMetrics } from "@/actions/cart"
import { validateDeliveryAddress, validatePhoneNumber } from "@/lib/utils"
import { KITCHEN_COORDS, MAX_RADIUS_KM } from "@/lib/constants"
import { useCart } from "@/context/CartContext"
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps"

function CheckoutMapContent({
  lat,
  lng,
  onLocationChange,
}: {
  lat: number | null
  lng: number | null
  onLocationChange: (lat: number, lng: number) => void
}) {
  const map = useMap()
  const routesLibrary = useMapsLibrary("routes")
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  const markerPos = useMemo(() => {
    if (lat && lng) return { lat, lng }
    return KITCHEN_COORDS
  }, [lat, lng])

  useEffect(() => {
    if (!routesLibrary || !map) return

    const ds = new routesLibrary.DirectionsService()
    const dr = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#EA580C",
        strokeWeight: 4,
      },
    })

    setDirectionsService(ds)
    setDirectionsRenderer(dr)

    return () => {
      dr.setMap(null)
    }
  }, [routesLibrary, map])

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return

    const isAtKitchen =
      Math.abs(markerPos.lat - KITCHEN_COORDS.lat) < 0.0001 &&
      Math.abs(markerPos.lng - KITCHEN_COORDS.lng) < 0.0001

    if (isAtKitchen) {
      directionsRenderer.setDirections({ routes: [] } as any)
      return
    }

    directionsService.route(
      {
        origin: KITCHEN_COORDS,
        destination: markerPos,
        travelMode: (window.google?.maps?.TravelMode?.DRIVING || "DRIVING") as google.maps.TravelMode,
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result)
        }
      }
    )
  }, [directionsService, directionsRenderer, markerPos])

  const handleAutolocate = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const newLat = position.coords.latitude
        const newLng = position.coords.longitude
        onLocationChange(newLat, newLng)
        if (map) {
          map.panTo({ lat: newLat, lng: newLng })
          map.setZoom(15)
        }
      },
      (err) => {
        setIsLocating(false)
        console.error("Error retrieving location:", err)
        alert("Unable to retrieve your location. Please drop a pin manually.")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-[#c0c9c0] shadow-sm bg-[#fdf9f1]">
      <div className="px-3.5 py-2 bg-[#f7f3eb] border-b border-[#c0c9c0]/50 flex items-center justify-between text-xs text-[#414942]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#033921]">pin_drop</span>
          <span className="font-semibold text-[#002211]">Delivery Map</span>
          <span className="text-[10px] text-[#717972]">(Drag pin to spot)</span>
        </div>
        <div className="flex items-center gap-2">
          {markerPos && (
            <span className="font-mono text-[11px] text-[#7b5900] bg-white px-2 py-0.5 rounded border border-[#c0c9c0]/40">
              {markerPos.lat.toFixed(4)}, {markerPos.lng.toFixed(4)}
            </span>
          )}
          <button
            type="button"
            onClick={handleAutolocate}
            disabled={isLocating}
            title="Autolocate"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#033921] hover:bg-[#002211] text-white text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[14px]">
              {isLocating ? "progress_activity" : "my_location"}
            </span>
            <span>{isLocating ? "Locating..." : "Autolocate"}</span>
          </button>
        </div>
      </div>

      <div style={{ height: "260px", width: "100%" }} className="relative z-0">
        <Map
          defaultCenter={KITCHEN_COORDS}
          center={markerPos}
          defaultZoom={13}
          mapId="CHECKOUT_MAP_ID"
          style={{ height: "100%", width: "100%" }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={(e) => {
            if (e.detail?.latLng) {
              onLocationChange(e.detail.latLng.lat, e.detail.latLng.lng)
            }
          }}
        >
          {/* Kitchen pin */}
          <AdvancedMarker position={KITCHEN_COORDS} title="Naadan Cloud Kitchen (Sadar, Nagpur)">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EA580C] text-white shadow-md border-2 border-white ring-1 ring-black/15">
              <span className="material-symbols-outlined text-[18px]">store</span>
            </div>
          </AdvancedMarker>

          {/* Draggable customer pin */}
          <AdvancedMarker
            position={markerPos}
            draggable={true}
            title="Delivery Location (Drag to adjust)"
            onDragEnd={(e) => {
              if (e.latLng) {
                const newLat =
                  typeof e.latLng.lat === "function" ? e.latLng.lat() : Number((e.latLng as any).lat)
                const newLng =
                  typeof e.latLng.lng === "function" ? e.latLng.lng() : Number((e.latLng as any).lng)
                onLocationChange(newLat, newLng)
              }
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#033921] text-white shadow-md border-2 border-white ring-1 ring-black/15">
              <span className="material-symbols-outlined text-[18px]">person_pin_circle</span>
            </div>
          </AdvancedMarker>
        </Map>
      </div>
    </div>
  )
}

export function CheckoutForm() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const etaDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const {
    items,
    itemTotal,
    deliveryFee,
    lat,
    lng,
    distanceKm,
    deliveryEta,
    isOutOfZone,
    isPinAtDefault,
    address,
    geocodedBaseAddress,
    phoneNumber,
    phoneError,
    savedAddresses,
    selectedSavedAddressId,
    isCalculatingEta,
    isGeocoding,
    error,
    deviceFingerprint,
    setCoordinates,
    updateDeliveryMetrics,
    setAddress,
    setPhoneNumber,
    applySavedAddress,
    setError,
    setIsCalculatingEta,
    setIsGeocoding,
  } = useCart()

  // 5% GST calculation on food bill
  const gstAmount = useMemo(() => Math.round(itemTotal * 0.05), [itemTotal])
  const grandTotal = useMemo(() => {
    if (items.length === 0) return 0
    return itemTotal + gstAmount + deliveryFee
  }, [items.length, itemTotal, gstAmount, deliveryFee])

  // Local state for address saving preferences
  const [saveToProfile, setSaveToProfile] = useState(false)
  const [addressLabel, setAddressLabel] = useState("Home")
  const [flatDetails, setFlatDetails] = useState("")

  const addressValidation = validateDeliveryAddress(address, geocodedBaseAddress)
  const isAddressValid = addressValidation.isValid

  const phoneValidation = validatePhoneNumber(phoneNumber)
  const isPhoneValid = phoneValidation.isValid

  const isSubmitDisabled =
    isPending || isPinAtDefault || isOutOfZone || !isAddressValid || !isPhoneValid || items.length === 0

  // Handle location changes, debounced ETA calculation (400ms), and auto-fill delivery address textarea
  const handleLocationChange = (selectedLat: number, selectedLng: number) => {
    setCoordinates(selectedLat, selectedLng)
    if (error === "Please drop the pin on your exact delivery location.") {
      setError(null)
    }

    // Client-side Geocoder instant autofill
    if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: { lat: selectedLat, lng: selectedLng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            // Keep precise lat/lng coordinates in component state
            setCoordinates(selectedLat, selectedLng)

            // Parse address_components to extract route, sublocality, and locality
            const components = results[0].address_components || []
            const getComponent = (...types: string[]) => {
              const matched = components.find((c) =>
                types.some((t) => c.types.includes(t))
              )
              return matched?.long_name || ""
            }

            const route = getComponent("route")
            const sublocality = getComponent(
              "sublocality_level_1",
              "sublocality",
              "sublocality_level_2"
            )
            const locality = getComponent("locality")

            const addressParts = [route, sublocality, locality].filter(Boolean)
            const cleanAddress =
              addressParts.length > 0
                ? addressParts.join(", ")
                : results[0].formatted_address
                    ?.replace(/^[A-Z0-9]{4,}\+[A-Z0-9]{2,},?\s*/i, "")
                    .replace(/, India$/, "") || ""

            if (cleanAddress) {
              setAddress(cleanAddress)
            }
          }
        })
      } catch {
        // Fallback to server metrics below
      }
    }

    if (etaDebounceRef.current) {
      clearTimeout(etaDebounceRef.current)
    }

    setIsCalculatingEta(true)
    setIsGeocoding(true)

    etaDebounceRef.current = setTimeout(async () => {
      try {
        const metrics = await getDeliveryMetrics(selectedLat, selectedLng)
        // Dynamically updates master cart state: distance, deliveryFee, ETA, and geocoded address
        updateDeliveryMetrics({
          lat: selectedLat,
          lng: selectedLng,
          distanceKm: metrics.distanceKm,
          travelMins: metrics.travelMins,
          prepMins: metrics.prepMins,
          totalEtaMins: metrics.totalEtaMins,
          formattedAddress: metrics.formattedAddress,
        })
        if (metrics.formattedAddress) {
          setAddress(metrics.formattedAddress)
        }
        setError(null)
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
      setError(err)
      return
    }

    // 3. Check if map pin has moved from default
    if (isPinAtDefault) {
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
        deliveryFee,
        distanceKm: distanceKm ?? undefined,
        deviceFingerprint,
        saveAddressToProfile: saveToProfile,
        addressLabel: saveToProfile ? addressLabel : undefined,
        flatDetails: flatDetails.trim() || undefined,
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
    <form onSubmit={handleSubmit} className="bg-[#ffffff] rounded-2xl shadow-sm p-6 flex flex-col gap-4 border border-[#f1ede6]">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
          Delivery Details
        </h3>
        {distanceKm !== null && (
          <span className="text-[11px] font-mono text-[#033921] font-semibold bg-[#e8f5e9] px-2.5 py-0.5 rounded-full border border-[#38684c]/20">
            Fee: ₹{deliveryFee}
          </span>
        )}
      </div>

      {/* Saved Addresses Dropdown/Chips */}
      {savedAddresses.length > 0 && (
        <div className="bg-[#fcf8f2] p-3 rounded-xl border border-[#c0c9c0]/40">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7b5900] mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">bookmark</span>
            Saved Delivery Addresses
          </label>
          <div className="flex flex-wrap gap-2">
            {savedAddresses.map((addr) => {
              const isSelected = selectedSavedAddressId === addr.id
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => applySavedAddress(addr)}
                  className={`text-left text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#033921] text-white border-[#033921] shadow-xs font-semibold"
                      : "bg-white text-[#1c1c17] border-[#c0c9c0] hover:border-[#7b5900]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {addr.label.toLowerCase() === "work" ? "business" : "home"}
                  </span>
                  <span>{addr.label}</span>
                  <span className="opacity-75 text-[10px] line-clamp-1 max-w-[120px]">
                    ({addr.flatDetails})
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Location Picker & Interactive Map */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Delivery Pin &amp; Cloud Kitchen
        </label>
        <APIProvider apiKey={(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "") as string}>
          <CheckoutMapContent
            lat={lat}
            lng={lng}
            onLocationChange={handleLocationChange}
          />
        </APIProvider>
        {deliveryEta && !isPinAtDefault && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e8f5e9] border border-[#38684c]/20 text-[#033921] text-xs font-semibold shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#033921]">schedule</span>
            <span>
              Estimated Delivery: {deliveryEta.totalEtaMins} mins ({deliveryEta.prepMins}m kitchen prep + {deliveryEta.travelMins}m travel, {deliveryEta.distanceKm} km)
            </span>
          </div>
        )}
      </div>

      {/* Address Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-[#717972]">
            Full Delivery Address
          </label>
          {isGeocoding && (
            <span className="text-[11px] text-[#7b5900] font-normal normal-case flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
              Syncing address from map pin...
            </span>
          )}
        </div>
        <textarea
          id="address"
          name="address"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            if (error) setError(null)
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
            <span>Address synced from map. Edit or prepend your Flat/House No. as needed.</span>
          </p>
        ) : (
          <p className="text-[11px] text-[#717972] mt-1">Minimum 15 characters required (e.g., Flat/House No., Street, Area).</p>
        )}
      </div>

      {/* Landmark / Building Name / Flat No. (Optional) */}
      <div>
        <label htmlFor="flatDetails" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Landmark / Building Name / Flat No. (Optional)
        </label>
        <input
          id="flatDetails"
          name="flatDetails"
          type="text"
          value={flatDetails}
          onChange={(e) => setFlatDetails(e.target.value)}
          placeholder="e.g. Near City Center Mall, Block B, Flat 402"
          className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all"
        />
      </div>

      {/* Save Address to Profile Checkbox */}
      <div className="bg-[#fcf8f2] p-3 rounded-xl border border-[#c0c9c0]/30 space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-[#002211] cursor-pointer">
          <input
            type="checkbox"
            checked={saveToProfile}
            onChange={(e) => setSaveToProfile(e.target.checked)}
            className="rounded border-[#c0c9c0] text-[#033921] focus:ring-[#033921]"
          />
          <span>Save this address to profile for future orders</span>
        </label>
        {saveToProfile && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#717972] mb-0.5">
                Address Tag
              </label>
              <select
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17]"
              >
                <option value="Home">Home</option>
                <option value="Work">Work / Office</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#717972] mb-0.5">
                Flat / Door Details
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 402, 4th Floor"
                value={flatDetails}
                onChange={(e) => setFlatDetails(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17]"
              />
            </div>
          </div>
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
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            maxLength={13}
            placeholder="9876543210"
            className={`w-full px-3.5 py-2.5 rounded-r-lg border text-sm transition-all ${
              phoneError
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
          <span>Out of 8km delivery zone ({distanceKm?.toFixed(1)} km).</span>
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
          <span>
            Location confirmed: {distanceKm.toFixed(1)} km from kitchen (Delivery Fee: ₹{deliveryFee}).
          </span>
        </div>
      ) : null}

      {/* Bill Summary - Perfectly bound to single source of truth */}
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
          <div className="flex justify-between items-center text-[#414942]">
            <div className="flex items-center gap-1.5">
              <span>Delivery Partner Fee</span>
              {distanceKm !== null && distanceKm > 3 && (
                <span className="text-[10px] text-[#7b5900] bg-[#ffdea4]/40 px-1 py-0.2 rounded font-medium">
                  {distanceKm.toFixed(1)} km
                </span>
              )}
            </div>
            <span className="font-medium text-[#002211] font-mono">₹{deliveryFee}</span>
          </div>
          <div className="border-t border-[#c0c9c0]/40 pt-2 flex justify-between font-bold text-[#002211] text-sm">
            <span>Total Payable</span>
            <span className="text-[#033921] font-mono">₹{grandTotal}</span>
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
            Out of 8km delivery zone
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
            Place Order (₹{grandTotal})
          </>
        )}
      </button>

      <p className="text-[10px] text-[#717972] text-center">
        By placing your order you agree to Naadan&apos;s terms of service.
      </p>
    </form>
  )
}
