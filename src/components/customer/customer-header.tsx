"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { LogoutButton } from "@/components/auth/logout-button"

interface CustomerHeaderProps {
  cartCount?: number
  activePage?: "home" | "menu" | "cart" | "track" | "profile" | "orders"
  userName?: string | null
}

export function CustomerHeader({ cartCount = 0, activePage, userName }: CustomerHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
          <div className="h-8 w-auto">
            <Image
              src="/brand/Naadan-logo.jpg"
              alt="Naadan"
              width={32}
              height={32}
              className="h-8 w-auto object-contain"
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { href: "/home", label: "Home", key: "home" },
            { href: "/menu", label: "Menu", key: "menu" },
            { href: "/cart", label: "Cart", key: "cart" },
            { href: "/orders", label: "Orders", key: "orders" },
            { href: "/profile", label: "Profile", key: "profile" },
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
            <span className="text-xs font-semibold hidden sm:block">
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
            <span className="hidden lg:block text-sm font-medium text-[#414942]">{userName}</span>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#f1ede6] transition-colors"
          >
            <span className="material-symbols-outlined text-[24px] text-[#002211]">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>

          <div className="hidden lg:block">
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#fdf9f1] shadow-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="h-8 w-auto">
                <Image
                  src="/brand/Naadan-logo.jpg"
                  alt="Naadan"
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-[#f1ede6] transition-colors"
              >
                <span className="material-symbols-outlined text-[24px] text-[#002211]">close</span>
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {[
                { href: "/home", label: "Home", key: "home" },
                { href: "/menu", label: "Menu", key: "menu" },
                { href: "/cart", label: "Cart", key: "cart" },
                { href: "/orders", label: "Orders", key: "orders" },
                { href: "/profile", label: "Profile", key: "profile" },
              ].map(({ href, label, key }) => (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activePage === key
                      ? "bg-[#fcca66] text-[#755400] font-semibold"
                      : "text-[#414942] hover:text-[#002211] hover:bg-[#f1ede6]"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-[#f1ede6]">
              {userName && (
                <div className="mb-4">
                  <p className="text-xs text-[#717972] mb-1">Signed in as</p>
                  <p className="text-sm font-medium text-[#002211]">{userName}</p>
                </div>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}