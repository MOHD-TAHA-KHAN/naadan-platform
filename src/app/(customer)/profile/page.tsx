import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CustomerHeader } from "@/components/customer/customer-header"
import { CustomerFooter } from "@/components/customer/footer"
import { ProfileForm } from "@/components/shared/profile-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Profile | Naadan" }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      phone: true,
      address: true,
      image: true,
    },
  })

  return (
    <div className="min-h-screen bg-[#fdf9f1]">
      <CustomerHeader
        cartCount={0}
        activePage="profile"
        userName={session.user.name}
      />

      <main className="w-full pt-[calc(4rem+2.5rem)] md:pt-[calc(4rem+2.5rem+1.5rem)] px-4 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-[#717972] mb-6">
            <a href="/menu" className="hover:text-[#002211]">Menu</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#002211] font-semibold">Profile</span>
          </nav>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
              My Profile
            </h1>
            <p className="text-[#717972] text-sm mt-1">
              Manage your personal information and preferences
            </p>
          </div>

          <ProfileForm initialData={user || undefined} />
        </div>
      </main>
      <CustomerFooter />
    </div>
  )
}
