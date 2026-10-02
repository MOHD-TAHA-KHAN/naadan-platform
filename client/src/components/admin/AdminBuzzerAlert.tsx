"use client"

import { useAdminBuzzer } from "@/hooks/use-admin-buzzer"

export function AdminBuzzerAlert() {
  const {
    isBuzzing,
    audioEnabled,
    enableAudio,
    pendingOrderCount,
    stopBuzzing,
  } = useAdminBuzzer()

  return (
    <div className="flex items-center gap-3">
      {/* Sound enablement trigger for browser autoplay permissions */}
      {!audioEnabled && (
        <button
          type="button"
          onClick={enableAudio}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fcca66] hover:bg-[#f0bf5c] text-[#755400] text-xs font-bold transition-all shadow-xs cursor-pointer animate-pulse"
        >
          <span className="material-symbols-outlined text-[15px]">volume_up</span>
          <span>Enable Sound Alerts</span>
        </button>
      )}

      {/* Persistent buzzing banner */}
      {isBuzzing && (
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#ba1a1a] text-white shadow-md animate-bounce">
          <span className="material-symbols-outlined text-[18px] animate-spin">
            notifications_active
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">
            {pendingOrderCount} New Order{pendingOrderCount > 1 ? "s" : ""} Awaiting Acceptance!
          </span>
          <button
            type="button"
            onClick={stopBuzzing}
            className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold transition-colors cursor-pointer"
          >
            Mute Buzzer
          </button>
        </div>
      )}
    </div>
  )
}
