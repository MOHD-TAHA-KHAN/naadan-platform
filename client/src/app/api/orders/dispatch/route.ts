import { NextResponse } from "next/server"
import { KITCHEN_COORDS, KITCHEN_PHONE, PREP_TIME_MINS } from "@/lib/constants"
import { calculateDistance } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderId, customerName, customerPhone, dropCoords, dropAddress, itemsCount } = body

    if (!orderId || !dropCoords || !dropAddress) {
      return NextResponse.json(
        { error: "Missing required fields (orderId, dropCoords, dropAddress)." },
        { status: 400 }
      )
    }

    const pinMatch = dropAddress?.match(/\b(44\d{4}|\d{6})\b/)
    const dropPincode = pinMatch ? pinMatch[0] : "440001"

    const porterPayload = {
      request_id: `ORDER_${orderId}`,
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
          apartment_address: dropAddress,
          street_address: dropAddress,
          city: "Nagpur",
          state: "Maharashtra",
          pincode: dropPincode,
          country: "India",
          lat: dropCoords.lat,
          lng: dropCoords.lng,
        },
        contact_details: {
          name: customerName || "Valued Customer",
          phone_number: customerPhone || "+919876543210",
        },
      },
      additional_comments: "Cloud kitchen food package. Handle with care.",
    }

    const distanceKm = calculateDistance(
      KITCHEN_COORDS.lat,
      KITCHEN_COORDS.lng,
      Number(dropCoords.lat),
      Number(dropCoords.lng)
    )
    const travelMins = Math.max(1, Math.ceil((distanceKm / 25) * 60))
    const totalEtaMins = travelMins + PREP_TIME_MINS

    return NextResponse.json({
      trackingUrl: "https://porter.in/track/mock-123",
      status: "ORDER_CREATED",
      etaMins: totalEtaMins,
      porterPayload,
    })
  } catch (error) {
    console.error("Porter dispatch API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
