import Link from "next/link"
import Image from "next/image"
import { LogoutButton } from "@/components/auth/logout-button"

interface NavItem {
  href: string
  label: string
  icon: string
  active?: boolean
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/orders", label: "Order History / KDS", icon: "receipt_long" },
  { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
  { href: "/admin/delivery", label: "Delivery Tracking", icon: "local_shipping" },
  { href: "/admin/inventory", label: "Inventory", icon: "inventory_2" },
  { href: "/admin/menu-toggles", label: "Menu Toggles", icon: "toggle_on" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
]

interface AdminSidebarProps {
  activePath: string
  staffName?: string | null
}

export function AdminSidebar({ activePath, staffName }: AdminSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#033921] text-white z-50 flex flex-col pt-4 pb-4 shadow-[0_4px_20px_-2px_rgba(3,57,33,0.25)]">
      {/* Brand */}
      <div className="px-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#fdf9f1] flex items-center justify-center shadow-sm overflow-hidden">
          <Image
            src="/brand/Naadan-logo.jpg"
            alt="Naadan"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span
            className="font-bold text-[#fdf9f1] text-lg leading-none tracking-wide"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Naadan
          </span>
          <span className="text-[10px] font-semibold tracking-widest uppercase text-[#ffdea4] mt-0.5">
            Operations &amp; Admin
          </span>
        </div>
      </div>

      {/* Kitchen status */}
      <div className="mx-4 mb-4 p-2 bg-[#002211]/60 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-[#ffdea4]">soup_kitchen</span>
          <span className="text-[11px] font-semibold text-[#baefcb]">Civil Lines Cloud Station</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-[#fcca66] animate-pulse" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive = activePath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                isActive
                  ? "bg-[#fcca66] text-[#755400] shadow-sm"
                  : "text-[#baefcb] hover:bg-[#002211] hover:text-white"
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-[#755400]" : ""}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 pt-4 border-t border-[#fdf9f1]/10">
        <div className="p-2 bg-[#002211] rounded-lg flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-[#baefcb]">{staffName ?? "Admin"}</p>
            <p className="text-[10px] text-[#72a484]">Kitchen Operations</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#033921] border border-[#baefcb]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#baefcb] text-[16px]">admin_panel_settings</span>
          </div>
        </div>
        <LogoutButton className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#002211] hover:bg-[#000e08] text-[#baefcb] text-xs font-medium transition-colors" />
      </div>
    </aside>
  )
}
