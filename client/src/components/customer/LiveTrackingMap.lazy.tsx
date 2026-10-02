"use client"

import dynamic from "next/dynamic"

const LiveTrackingMap = dynamic(
  () => import("./LiveTrackingMap"),
  {
    loading: () => (
      <div className="w-full h-64 rounded-xl overflow-hidden border border-[#c0c9c0] shadow-sm bg-[#fdf9f1] animate-pulse">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="material-symbols-outlined text-[32px] text-[#033921] animate-pulse">
              local_shipping
            </div>
            <p className="text-sm text-[#414942] mt-2">Loading live tracking...</p>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default LiveTrackingMap