import { cn } from "./cn"
import type { HTMLAttributes } from "react"

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  id?: string
}

export function Badge({ id, className, children, ...rest }: BadgeProps) {
  return (
    <span
      id={id}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
