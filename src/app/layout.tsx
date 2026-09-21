import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Naadan • Authentic Kerala Kitchen in Nagpur", template: "%s | Naadan" },
  description:
    "Slow-cooked in seasoned earthen pots, wrapped in singed banana leaves. Pure heritage Kerala recipes delivered warm across Nagpur.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
