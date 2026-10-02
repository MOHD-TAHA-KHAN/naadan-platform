"use client"

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react"
import { KITCHEN_COORDS, FOOD_GST_PERCENT, MAX_RADIUS_KM } from "@/lib/constants"
import { calculateDistance, validatePhoneNumber, validateDeliveryAddress } from "@/lib/utils"
import { getDeviceFingerprint } from "@/lib/fingerprint"

export interface CartItemType {
  id: string
  userId?: string
  menuItemId?: string
  price: number
  quantity: number
  menuItem: {
    id: string
    name: string
    price: number
    imageUrl?: string | null
    description?: string | null
  }
}

export interface SavedAddressType {
  id: string
  userId?: string
  label: string
  flatDetails: string
  street?: string | null
  fullAddress: string
  lat: number
  lng: number
  isDefault?: boolean
}

export interface DeliveryEtaType {
  travelMins: number
  prepMins: number
  totalEtaMins: number
  distanceKm: number | string
}

/**
 * Single source of truth calculation for delivery pricing.
 * Base ₹40 for up to 3km, +₹10 per km beyond 3km, capped at ₹100.
 */
export function calculateDeliveryFee(distanceKm?: string | number | null): number {
  if (distanceKm === null || distanceKm === undefined) return 40
  const dist = typeof distanceKm === "string" ? parseFloat(distanceKm) : distanceKm
  if (isNaN(dist) || dist <= 3) return 40
  return Math.min(100, Math.round(40 + (dist - 3) * 10))
}

interface CartContextValue {
  // Items & totals
  items: CartItemType[]
  itemTotal: number
  gstAmount: number
  deliveryFee: number
  grandTotal: number

  // Location & delivery state
  lat: number | null
  lng: number | null
  distanceKm: number | null
  deliveryEta: DeliveryEtaType | null
  isOutOfZone: boolean
  isPinAtDefault: boolean

  // Address & contact
  address: string
  geocodedBaseAddress: string | null
  phoneNumber: string
  phoneError: string | null
  savedAddresses: SavedAddressType[]
  selectedSavedAddressId: string | null

  // Meta & loaders
  isCalculatingEta: boolean
  isGeocoding: boolean
  error: string | null
  deviceFingerprint: string

  // Actions
  setItems: React.Dispatch<React.SetStateAction<CartItemType[]>>
  setCoordinates: (lat: number, lng: number) => void
  updateDeliveryMetrics: (metrics: {
    lat: number
    lng: number
    distanceKm: number | string
    travelMins: number
    prepMins: number
    totalEtaMins: number
    formattedAddress?: string
  }) => void
  setAddress: (address: string) => void
  setPhoneNumber: (phone: string) => void
  applySavedAddress: (saved: SavedAddressType) => void
  setSavedAddresses: (addresses: SavedAddressType[]) => void
  setError: (err: string | null) => void
  setIsCalculatingEta: (val: boolean) => void
  setIsGeocoding: (val: boolean) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

interface CartProviderProps {
  children: React.ReactNode
  initialItems?: CartItemType[]
  initialSavedAddresses?: SavedAddressType[]
  initialPhone?: string
}

export function CartProvider({
  children,
  initialItems = [],
  initialSavedAddresses = [],
  initialPhone = "",
}: CartProviderProps) {
  const [items, setItems] = useState<CartItemType[]>(initialItems)
  const [lat, setLat] = useState<number | null>(KITCHEN_COORDS.lat)
  const [lng, setLng] = useState<number | null>(KITCHEN_COORDS.lng)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [deliveryEta, setDeliveryEta] = useState<DeliveryEtaType | null>(null)
  const [deliveryFee, setDeliveryFee] = useState<number>(() =>
    initialItems.length > 0 ? 40 : 0
  )

  const [address, setAddress] = useState<string>("")
  const [geocodedBaseAddress, setGeocodedBaseAddress] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumberState] = useState<string>(initialPhone)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const [savedAddresses, setSavedAddresses] = useState<SavedAddressType[]>(initialSavedAddresses)
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null)

  const [isCalculatingEta, setIsCalculatingEta] = useState<boolean>(false)
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("")

  // Initialize fingerprint on client mount
  useEffect(() => {
    setDeviceFingerprint(getDeviceFingerprint())
  }, [])

  // Check pin at kitchen default
  const isPinAtDefault = useMemo(() => {
    if (lat === null || lng === null) return true
    return (
      Math.abs(lat - KITCHEN_COORDS.lat) < 0.0001 &&
      Math.abs(lng - KITCHEN_COORDS.lng) < 0.0001
    )
  }, [lat, lng])

  // Out of zone check (8 km)
  const isOutOfZone = useMemo(() => {
    if (distanceKm === null) return false
    return distanceKm > MAX_RADIUS_KM
  }, [distanceKm])

  // Financial calculations
  const itemTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const gstAmount = useMemo(() => {
    return Math.round(itemTotal * (FOOD_GST_PERCENT / 100))
  }, [itemTotal])

  const grandTotal = useMemo(() => {
    if (itemTotal === 0) return 0
    return itemTotal + gstAmount + deliveryFee
  }, [itemTotal, gstAmount, deliveryFee])

  // Phone validation handler
  const setPhoneNumber = useCallback((val: string) => {
    setPhoneNumberState(val)
    if (val.trim().length > 0) {
      const res = validatePhoneNumber(val)
      setPhoneError(res.isValid ? null : res.error ?? "Invalid mobile number")
    } else {
      setPhoneError(null)
    }
  }, [])

  // Update coordinates directly
  const setCoordinates = useCallback((newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
    const dist = calculateDistance(KITCHEN_COORDS.lat, KITCHEN_COORDS.lng, newLat, newLng)
    setDistanceKm(dist)
    const newFee = calculateDeliveryFee(dist)
    setDeliveryFee(newFee)
  }, [])

  // Core callback when maps calculates new distance & ETA metrics
  const updateDeliveryMetrics = useCallback(
    (metrics: {
      lat: number
      lng: number
      distanceKm: number | string
      travelMins: number
      prepMins: number
      totalEtaMins: number
      formattedAddress?: string
    }) => {
      setLat(metrics.lat)
      setLng(metrics.lng)
      const numDist =
        typeof metrics.distanceKm === "string"
          ? parseFloat(metrics.distanceKm)
          : metrics.distanceKm
      setDistanceKm(numDist)

      // Dynamically calculate and globally apply the new delivery fee
      const calculatedFee = calculateDeliveryFee(numDist)
      setDeliveryFee(calculatedFee)

      setDeliveryEta({
        travelMins: metrics.travelMins,
        prepMins: metrics.prepMins,
        totalEtaMins: metrics.totalEtaMins,
        distanceKm: metrics.distanceKm,
      })

      if (metrics.formattedAddress) {
        setGeocodedBaseAddress(metrics.formattedAddress)
        setAddress((prev) => {
          if (!prev.trim()) {
            return metrics.formattedAddress!
          }
          if (geocodedBaseAddress && prev.includes(geocodedBaseAddress)) {
            return prev.replace(geocodedBaseAddress, metrics.formattedAddress!)
          }
          const flatPrefixMatch = prev.match(
            /^(?:flat|house|room|plot|apt|apartment|#|unit|villa|door|shop|no\.)\s*[^,]+,\s*/i
          )
          if (flatPrefixMatch) {
            return `${flatPrefixMatch[0]}${metrics.formattedAddress}`
          }
          return metrics.formattedAddress!
        })
      }
    },
    [geocodedBaseAddress]
  )

  // Quick-apply a saved address
  const applySavedAddress = useCallback(
    (saved: SavedAddressType) => {
      setSelectedSavedAddressId(saved.id)
      setLat(saved.lat)
      setLng(saved.lng)

      const dist = calculateDistance(KITCHEN_COORDS.lat, KITCHEN_COORDS.lng, saved.lat, saved.lng)
      setDistanceKm(dist)
      setDeliveryFee(calculateDeliveryFee(dist))

      const fullFormatted = `${saved.flatDetails}${saved.street ? `, ${saved.street}` : ""}, ${saved.fullAddress}`
      setAddress(fullFormatted)
      setGeocodedBaseAddress(saved.fullAddress)
      setError(null)
    },
    []
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemTotal,
      gstAmount,
      deliveryFee,
      grandTotal,
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
      setItems,
      setCoordinates,
      updateDeliveryMetrics,
      setAddress,
      setPhoneNumber,
      applySavedAddress,
      setSavedAddresses,
      setError,
      setIsCalculatingEta,
      setIsGeocoding,
    }),
    [
      items,
      itemTotal,
      gstAmount,
      deliveryFee,
      grandTotal,
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
      setPhoneNumber,
      applySavedAddress,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
