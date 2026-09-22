import { auth } from "../../../../auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { ProfileForm } from "@/components/shared/profile-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Settings | Naadan Admin" }

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/")

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
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <AdminSidebar activePath="/admin/settings" staffName={session.user.name} />

      <div className="pl-64 flex-1">
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#ffffff]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-6">
          <span className="font-semibold text-sm text-[#002211]">Admin Settings</span>
        </header>

        <main className="pt-16 p-6 min-h-screen">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
              Profile Settings
            </h1>
            <p className="text-sm text-[#717972] mt-1">
              Manage your admin profile and contact information
            </p>
          </div>

          <div className="max-w-2xl">
            <ProfileForm initialData={user || undefined} />
          </div>
        </main>
      </div>
    </div>
  )
}
