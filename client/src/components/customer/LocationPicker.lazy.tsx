"use client"

import dynamic from "next/dynamic"

const LocationPicker = dynamic(
  () => import("./LocationPicker"),
  {
    loading: () => (
      <div className="w-full rounded-xl overflow-hidden border border-[#c0c9c0] shadow-sm bg-[#fdf9f1] animate-pulse">
        <div className="px-3.5 py-2 bg-[#f7f3eb] border-b border-[#c0c9c0]/50">
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-[260px] bg-gray-100" />
      </div>
    ),
    ssr: false,
  }
)

export default LocationPicker