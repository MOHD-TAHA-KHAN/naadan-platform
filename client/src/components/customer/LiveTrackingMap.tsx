"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { io } from "socket.io-client"

interface LiveTrackingMapProps {
  orderId: string
  status: string
  kitchenCoords: { lat: number; lng: number }
  customerCoords: { lat: number; lng: number } | null
  displayAddress?: string
}

function getEtaDetails(status: string) {
  switch (status) {
    case "PENDING":
      return {
        badge: "Order Placed",
        estimate: "35 – 45 mins",
        description: "Order received — confirming with Sadar kitchen now...",
        icon: "hourglass_top",
        pulseColor: "bg-[#fcca66]",
        bannerBg: "bg-[#033921]",
        textColor: "text-[#ffdea4]",
      }
    case "CONFIRMED":
      return {
        badge: "Order Confirmed",
        estimate: "30 – 40 mins",
        description: "Confirmed! Food is being prepared in Sadar kitchen.",
        icon: "check_circle",
        pulseColor: "bg-[#71dd8e]",
        bannerBg: "bg-[#033921]",
        textColor: "text-[#ffdea4]",
      }
    case "PREPARING":
      return {
        badge: "Cooking in Progress",
        estimate: "20 – 30 mins",
        description: "Food is being prepared in Sadar kitchen claypots...",
        icon: "outdoor_grill",
        pulseColor: "bg-[#ffb780]",
        bannerBg: "bg-[#033921]",
        textColor: "text-[#ffdea4]",
      }
    case "OUT_FOR_DELIVERY":
      return {
        badge: "Out for Delivery",
        estimate: "10 – 15 mins",
        description: "Rider dispatched from Sadar kitchen and on the way!",
        icon: "electric_moped",
        pulseColor: "bg-[#71dd8e]",
        bannerBg: "bg-[#003822]",
        textColor: "text-[#71dd8e]",
      }
    case "DELIVERED":
      return {
        badge: "Delivered",
        estimate: "Delivered",
        description: "Delivered! Enjoy your authentic Naadan feast 🎉",
        icon: "home",
        pulseColor: "bg-[#033921]",
        bannerBg: "bg-[#baefcb]",
        textColor: "text-[#002211]",
      }
    case "CANCELLED":
      return {
        badge: "Cancelled",
        estimate: "Cancelled",
        description: "This order has been cancelled.",
        icon: "cancel",
        pulseColor: "bg-[#ba1a1a]",
        bannerBg: "bg-[#ffdad6]",
        textColor: "text-[#93000a]",
      }
    default:
      return {
        badge: "Tracking",
        estimate: "30 – 40 mins",
        description: "Tracking your order progress...",
        icon: "schedule",
        pulseColor: "bg-[#fcca66]",
        bannerBg: "bg-[#033921]",
        textColor: "text-[#ffdea4]",
      }
  }
}

function MapRouteContent({
  kitchenCoords,
  customerCoords,
  status,
}: {
  kitchenCoords: { lat: number; lng: number }
  customerCoords: { lat: number; lng: number } | null
  status: string
}) {
  const map = useMap()
  const routesLibrary = useMapsLibrary("routes")
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)

  // Initialize DirectionsRenderer and DirectionsService
  useEffect(() => {
    if (!routesLibrary || !map) return

    const ds = new routesLibrary.DirectionsService()
    const dr = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: "#EA580C",
        strokeWeight: 5,
        strokeOpacity: 0.9,
      },
    })

    setDirectionsService(ds)
    setDirectionsRenderer(dr)

    return () => {
      dr.setMap(null)
    }
  }, [routesLibrary, map])

  // Calculate driving directions between Sadar kitchen and customer coordinates
  useEffect(() => {
    if (!directionsService || !directionsRenderer) return

    if (!customerCoords) {
      if (map) {
        map.panTo(kitchenCoords)
        map.setZoom(14)
      }
      return
    }

    directionsService.route(
      {
        origin: kitchenCoords,
        destination: customerCoords,
        travelMode: (window.google?.maps?.TravelMode?.DRIVING || "DRIVING") as google.maps.TravelMode,
      },
      (result, routeStatus) => {
        if (routeStatus === "OK" && result) {
          directionsRenderer.setDirections(result)
        } else {
          // Fallback bounds if Directions API fails or offline
          if (map) {
            const bounds = new google.maps.LatLngBounds()
            bounds.extend(kitchenCoords)
            bounds.extend(customerCoords)
            map.fitBounds(bounds, 50)
          }
        }
      }
    )
  }, [directionsService, directionsRenderer, kitchenCoords, customerCoords, map])

  return (
    <>
      {/* Sadar Kitchen Marker */}
      <AdvancedMarker position={kitchenCoords} title="Naadan Cloud Kitchen (Sadar, Nagpur)">
        <div className="flex flex-col items-center group cursor-pointer">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#EA580C] text-white shadow-lg border-2 border-white ring-2 ring-[#EA580C]/40">
            <span className="material-symbols-outlined text-[20px]">store</span>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded bg-[#033921] text-[#ffdea4] text-[10px] font-bold shadow-md whitespace-nowrap">
            Kitchen (Sadar)
          </span>
        </div>
      </AdvancedMarker>

      {/* Customer Delivery Marker */}
      {customerCoords && (
        <AdvancedMarker position={customerCoords} title="Your Delivery Location">
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#033921] text-white shadow-lg border-2 border-white ring-2 ring-[#033921]/40 animate-bounce">
              <span className="material-symbols-outlined text-[20px]">person_pin_circle</span>
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-white text-[#002211] text-[10px] font-bold shadow-md border border-[#c0c9c0] whitespace-nowrap">
              Delivery Spot
            </span>
          </div>
        </AdvancedMarker>
      )}
    </>
  )
}

export function LiveTrackingMap({
  orderId,
  status,
  kitchenCoords,
  customerCoords,
  displayAddress,
}: LiveTrackingMapProps) {
  const router = useRouter()
  const eta = useMemo(() => getEtaDetails(status), [status])

  // Listen for real-time status updates via Socket.io
  useEffect(() => {
    if (!orderId) return
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000"
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    })

    socket.on("connect", () => {
      socket.emit("join:order", orderId)
    })

    socket.on("order:status_updated", (updatedOrder: { id: string; status: string }) => {
      if (updatedOrder && updatedOrder.id === orderId) {
        router.refresh()
      }
    })

    return () => {
      socket.emit("leave:order", orderId)
      socket.disconnect()
    }
  }, [orderId, router])

  const defaultCenter = useMemo(() => {
    if (customerCoords) {
      return {
        lat: (kitchenCoords.lat + customerCoords.lat) / 2,
        lng: (kitchenCoords.lng + customerCoords.lng) / 2,
      }
    }
    return kitchenCoords
  }, [kitchenCoords, customerCoords])

  const apiKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "") as string

  return (
    <div className="bg-[#ffffff] rounded-2xl shadow-sm border border-[#f1ede6] overflow-hidden">
      {/* ── Dynamic Live ETA Banner ────────────────────────────────────────── */}
      <div className={`p-4 sm:p-5 ${eta.bannerBg} text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className={`material-symbols-outlined text-[24px] ${eta.textColor}`}>
              {eta.icon}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${eta.pulseColor} animate-ping`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${eta.textColor}`}>
                {eta.badge}
              </span>
            </div>
            <p className="text-sm font-medium text-white/95 mt-0.5">
              {eta.description}
            </p>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl px-4 py-2 sm:text-right shrink-0">
          <p className="text-[10px] text-white/70 uppercase tracking-wider font-medium">Estimated Arrival</p>
          <p className={`text-base font-bold ${eta.textColor}`}>{eta.estimate}</p>
        </div>
      </div>

      {/* ── Route Google Map ──────────────────────────────────────────────── */}
      <div className="h-[320px] sm:h-[380px] w-full relative">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={13}
            mapId="LIVE_TRACKING_MAP"
            style={{ height: "100%", width: "100%" }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            <MapRouteContent
              kitchenCoords={kitchenCoords}
              customerCoords={customerCoords}
              status={status}
            />
          </Map>
        </APIProvider>

        {/* Map overlay pills */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[#002211] text-xs font-semibold shadow-md border border-[#c0c9c0]/50">
            <span className="material-symbols-outlined text-[14px] text-[#EA580C]">store</span>
            Cloud Kitchen: Sadar, Nagpur
          </span>
          {displayAddress && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[#002211] text-xs font-semibold shadow-md border border-[#c0c9c0]/50 max-w-[280px] sm:max-w-md truncate">
              <span className="material-symbols-outlined text-[14px] text-[#033921] shrink-0">pin_drop</span>
              <span className="truncate">{displayAddress}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveTrackingMap
