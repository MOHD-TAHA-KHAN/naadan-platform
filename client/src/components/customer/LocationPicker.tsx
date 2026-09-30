"use client"

import { useState, useCallback, useEffect } from "react"
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { KITCHEN_COORDS } from "@/lib/constants"

export { KITCHEN_COORDS }

interface LocationPickerProps {
  onLocationChange?: (lat: number, lng: number) => void
  initialLocation?: { lat: number; lng: number } | [number, number] | null
  height?: string
}

function LocationPickerContent({
  onLocationChange,
  initialLocation,
  height = "260px",
}: LocationPickerProps) {
  const map = useMap()
  const routesLibrary = useMapsLibrary("routes")
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)

  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number }>(() => {
    if (initialLocation) {
      if (Array.isArray(initialLocation)) {
        return { lat: initialLocation[0], lng: initialLocation[1] }
      }
      return initialLocation
    }
    return KITCHEN_COORDS
  })
  const [isLocating, setIsLocating] = useState(false)

  const updateCoordinates = useCallback(
    (lat: number, lng: number) => {
      setMarkerPos({ lat, lng })
      if (onLocationChange) {
        onLocationChange(lat, lng)
      }
    },
    [onLocationChange]
  )

  // Initialize DirectionsService and DirectionsRenderer
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

  // Hook into DirectionsService to calculate DRIVING directions from KITCHEN_COORDS to customer pin
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
        } else {
          console.warn("Directions request returned:", status)
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
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        updateCoordinates(lat, lng)
        if (map) {
          map.panTo({ lat, lng })
          map.setZoom(15)
        }
      },
      (error) => {
        setIsLocating(false)
        console.error("Error retrieving location:", error)
        alert("Unable to retrieve your location. Please drop a pin manually.")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
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

      <div style={{ height, width: "100%" }} className="relative z-0">
        <Map
          defaultCenter={KITCHEN_COORDS}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          style={{ height: "100%", width: "100%" }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={(e) => {
            if (e.detail?.latLng) {
              updateCoordinates(e.detail.latLng.lat, e.detail.latLng.lng)
            }
          }}
        >
          {/* Static Kitchen Marker with custom store pin icon */}
          <AdvancedMarker
            position={KITCHEN_COORDS}
            title="Naadan Cloud Kitchen"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EA580C] text-white shadow-md border-2 border-white ring-1 ring-black/15">
              <span className="material-symbols-outlined text-[18px]">store</span>
            </div>
          </AdvancedMarker>

          {/* Draggable Customer Delivery Marker */}
          <AdvancedMarker
            position={markerPos}
            draggable={true}
            title="Delivery Location (Drag to adjust)"
            onDragEnd={(e) => {
              if (e.latLng) {
                const lat =
                  typeof e.latLng.lat === "function" ? e.latLng.lat() : Number((e.latLng as any).lat)
                const lng =
                  typeof e.latLng.lng === "function" ? e.latLng.lng() : Number((e.latLng as any).lng)
                updateCoordinates(lat, lng)
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

export default function LocationPicker(props: LocationPickerProps) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}>
      <LocationPickerContent {...props} />
    </APIProvider>
  )
}

export { LocationPicker }

