"use client"

import { useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

export const KITCHEN_COORDS: [number, number] = [21.1458, 79.0882]

interface LocationPickerProps {
  onLocationChange?: (lat: number, lng: number) => void
  initialLocation?: [number, number] | null
  height?: string
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({
  onLocationChange,
  initialLocation,
  height = "260px",
}: LocationPickerProps) {
  const [customerLocation, setCustomerLocation] = useState<[number, number] | null>(
    initialLocation ?? null
  )

  const handleLocationSelect = (lat: number, lng: number) => {
    setCustomerLocation([lat, lng])
    if (onLocationChange) {
      onLocationChange(lat, lng)
    }
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-[#c0c9c0] shadow-sm bg-[#fdf9f1]">
      <div className="px-3.5 py-2 bg-[#f7f3eb] border-b border-[#c0c9c0]/50 flex items-center justify-between text-xs text-[#414942]">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#033921]">pin_drop</span>
          <span className="font-semibold text-[#002211]">Delivery Map</span>
          <span className="text-[10px] text-[#717972]">(Click to pin spot)</span>
        </div>
        {customerLocation && (
          <span className="font-mono text-[11px] text-[#7b5900] bg-white px-2 py-0.5 rounded border border-[#c0c9c0]/40">
            {customerLocation[0].toFixed(4)}, {customerLocation[1].toFixed(4)}
          </span>
        )}
      </div>

      <div style={{ height, width: "100%" }} className="relative z-0">
        <MapContainer
          center={KITCHEN_COORDS}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fixed Cloud Kitchen Marker */}
          <Marker position={KITCHEN_COORDS}>
            <Popup>Cloud Kitchen</Popup>
          </Marker>

          {/* Customer Selected Marker */}
          {customerLocation && (
            <Marker position={customerLocation}>
              <Popup>
                <div className="text-xs">
                  <strong>Delivery Location</strong>
                  <br />
                  {customerLocation[0].toFixed(4)}, {customerLocation[1].toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}

          <MapClickHandler onLocationSelect={handleLocationSelect} />
        </MapContainer>
      </div>
    </div>
  )
}

export { LocationPicker }
