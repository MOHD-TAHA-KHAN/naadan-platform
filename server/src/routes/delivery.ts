import { Router, type Request, type Response } from "express"
import { KITCHEN_COORDS, KITCHEN_PHONE, PREP_TIME_MINS } from "../constants"

const router = Router()

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function buildPorterPayload(params: {
  orderId: string
  customerName: string
  customerPhone: string
  dropCoords: { lat: number; lng: number }
  dropAddress: string
  itemsCount?: number
}) {
  const pinMatch = params.dropAddress?.match(/\b(44\d{4}|\d{6})\b/)
  const dropPincode = pinMatch ? pinMatch[0] : "440001"

  return {
    request_id: `ORDER_${params.orderId}`,
    pickup_details: {
      address: {
        apartment_address: "Naadan Central Kitchen",
        street_address: "Mount Road Extension, Sadar",
        city: "Nagpur",
        state: "Maharashtra",
        pincode: "440001",
        country: "India",
        lat: KITCHEN_COORDS.lat,
        lng: KITCHEN_COORDS.lng,
      },
      contact_details: {
        name: "Naadan Kitchen Dispatch",
        phone_number: KITCHEN_PHONE,
      },
    },
    drop_details: {
      address: {
        apartment_address: params.dropAddress,
        street_address: params.dropAddress,
        city: "Nagpur",
        state: "Maharashtra",
        pincode: dropPincode,
        country: "India",
        lat: params.dropCoords?.lat ?? KITCHEN_COORDS.lat,
        lng: params.dropCoords?.lng ?? KITCHEN_COORDS.lng,
      },
      contact_details: {
        name: params.customerName,
        phone_number: params.customerPhone,
      },
    },
    additional_comments: "Cloud kitchen food package. Handle with care.",
  }
}

// POST /api/delivery/porter-quote
router.post("/porter-quote", (req: Request, res: Response) => {
  const { orderId, customerName, customerPhone, dropCoords, dropAddress, itemsCount } = req.body

  if (!orderId || !dropCoords || !dropAddress) {
    return res.status(400).json({ error: "Missing required fields (orderId, dropCoords, dropAddress)." })
  }

  const payload = buildPorterPayload({
    orderId,
    customerName: customerName || "Valued Customer",
    customerPhone: customerPhone || "+919876543210",
    dropCoords,
    dropAddress,
    itemsCount,
  })

  const distanceKm = calculateDistance(
    KITCHEN_COORDS.lat,
    KITCHEN_COORDS.lng,
    Number(dropCoords.lat),
    Number(dropCoords.lng)
  )
  const travelMins = Math.max(1, Math.ceil((distanceKm / 25) * 60))
  const totalEtaMins = travelMins + PREP_TIME_MINS
  const estimatedFare = Math.max(40, Math.round(distanceKm * 12 + 30))

  return res.json({
    quoteId: `QUOTE_${orderId}`,
    estimatedFare,
    currency: "INR",
    distanceKm: Number(distanceKm.toFixed(1)),
    etaMins: totalEtaMins,
    porterPayload: payload,
  })
})

// POST /api/delivery/dispatch
router.post("/dispatch", (req: Request, res: Response) => {
  const { orderId, customerName, customerPhone, dropCoords, dropAddress, itemsCount } = req.body

  if (!orderId || !dropCoords || !dropAddress) {
    return res.status(400).json({ error: "Missing required fields (orderId, dropCoords, dropAddress)." })
  }

  const payload = buildPorterPayload({
    orderId,
    customerName: customerName || "Valued Customer",
    customerPhone: customerPhone || "+919876543210",
    dropCoords,
    dropAddress,
    itemsCount,
  })

  const distanceKm = calculateDistance(
    KITCHEN_COORDS.lat,
    KITCHEN_COORDS.lng,
    Number(dropCoords.lat),
    Number(dropCoords.lng)
  )
  const travelMins = Math.max(1, Math.ceil((distanceKm / 25) * 60))
  const totalEtaMins = travelMins + PREP_TIME_MINS

  // Mock success response according to specs until live Porter credentials are provided
  return res.json({
    trackingUrl: "https://porter.in/track/mock-123",
    status: "ORDER_CREATED",
    etaMins: totalEtaMins,
    porterPayload: payload,
  })
})

export default router
