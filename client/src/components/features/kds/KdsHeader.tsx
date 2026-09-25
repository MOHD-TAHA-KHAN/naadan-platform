"use client"

import { Badge } from "@/components/ui"
import { KdsSocket } from "./KdsSocket"

export function KdsHeader({ activeCount }: { activeCount: number }) {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-[#002211]">Live KDS Dispatch Feed</span>
        <Badge className="bg-[#fcca66] text-[#755400]">NAGPUR CENTRAL</Badge>
        <Badge id="kds-active-count" className="bg-[#033921] text-[#ffdea4]">
          {activeCount} active
        </Badge>
      </div>
      <KdsSocket initialActiveCount={activeCount} />
    </header>
  )
}
