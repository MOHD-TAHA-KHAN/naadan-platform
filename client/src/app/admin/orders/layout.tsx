import type { Metadata } from "next"

export const metadata: Metadata = { title: "Orders & KDS | Naadan Admin" }

export default function AdminOrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
