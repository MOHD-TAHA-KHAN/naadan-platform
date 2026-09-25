"use client"

import { useKdsSocket } from "@/hooks"
import { LivePulse } from "@/components/ui"

export function KdsSocket({ initialActiveCount }: { initialActiveCount: number }) {
  const { connected, refreshLabel, newOrderAlert, refresh } = useKdsSocket(initialActiveCount)

  return (
    <div className="flex items-center gap-3">
      {newOrderAlert && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ba1a1a] text-white text-[10px] font-semibold uppercase tracking-wider animate-bounce">
          <span className="material-symbols-outlined text-[13px]">notifications_active</span>
          New order!
        </span>
      )}

      <div className="flex items-center gap-1.5 bg-[#f1ede6] px-3 py-1.5 rounded-full">
        <LivePulse className={connected ? "bg-[#38684c]" : "bg-[#b98a2c]"} />
        <span className="text-[11px] font-semibold text-[#002211]">
          {connected ? "Live" : "Reconnecting…"}
        </span>
        <span className="text-[10px] text-[#717972]">· synced {refreshLabel}</span>
      </div>

      <button
        onClick={refresh}
        title="Force refresh"
        className="w-7 h-7 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e0] flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-outlined text-[15px] text-[#414942]">sync</span>
      </button>
    </div>
  )
}
