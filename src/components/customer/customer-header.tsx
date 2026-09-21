import Link from "next/link"
import { LogoutButton } from "@/components/auth/logout-button"

interface CustomerHeaderProps {
  cartCount?: number
  activePage?: "menu" | "cart" | "track"
  userName?: string | null
}

export function CustomerHeader({ cartCount = 0, activePage, userName }: CustomerHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#fdf9f1]/90 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(3,57,33,0.05)]">
      {/* Value strip */}
      <div className="w-full bg-[#033921] text-[#ffffff] py-1.5 px-4 lg:px-8 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 font-semibold text-[#ffdea4]">
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
            Clay Pot Dum Cooking
          </div>
          <div className="flex items-center gap-1 font-semibold text-[#ffdea4]">
            <span className="material-symbols-outlined text-[14px]">yard</span>
            Direct Spice Harvest — Wayanad &amp; Idukki
          </div>
          <div className="flex items-center gap-1 font-semibold text-[#ffdea4]">
            <span className="material-symbols-outlined text-[14px]">electric_moped</span>
            30-min Hot Eco-Insulated Delivery
          </div>
          <div className="flex items-center gap-1 text-[#baefcb]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#fcca66] animate-pulse" />
            Kitchen Live
          </div>
        </div>
      </div>

      <div className="h-16 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/menu" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#033921] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ffdea4] text-[18px]">soup_kitchen</span>
          </div>
          <span className="font-bold text-[#002211] text-lg tracking-wide" style={{ fontFamily: "Playfair Display, serif" }}>
            Naadan
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { href: "/menu", label: "Menu", key: "menu" },
            { href: "/cart", label: "Cart", key: "cart" },
          ].map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activePage === key
                  ? "bg-[#fcca66] text-[#755400] font-semibold"
                  : "text-[#414942] hover:text-[#002211] hover:bg-[#f1ede6]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Location */}
          <div className="hidden xl:flex items-center gap-1 bg-[#f1ede6] px-3 py-1.5 rounded-full text-xs text-[#414942]">
            <span className="material-symbols-outlined text-[14px] text-[#7b5900]">location_on</span>
            Nagpur • Civil Lines (24-35 min)
          </div>

          {/* Cart */}
          <Link
            href="/cart"
            className="flex items-center gap-1.5 bg-[#ebe8e0] hover:bg-[#e6e2da] px-3 py-1.5 rounded-full text-[#1c1c17] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#002211]">shopping_bag</span>
            <span className="text-xs font-semibold">
              {cartCount > 0 ? `${cartCount} items` : "Cart"}
            </span>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#7b5900] text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User */}
          {userName && (
            <span className="hidden sm:block text-sm font-medium text-[#414942]">{userName}</span>
          )}

          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
