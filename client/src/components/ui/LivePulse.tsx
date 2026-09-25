import { cn } from "./cn"

export function LivePulse({ className }: { className?: string }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
          className ?? "bg-[#38684c]",
        )}
      />
      <span
        className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          className ?? "bg-[#38684c]",
        )}
      />
    </span>
  )
}
