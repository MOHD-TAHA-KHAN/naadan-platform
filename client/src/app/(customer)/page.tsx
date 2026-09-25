import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CustomerHeader } from "@/components/customer/customer-header"
import { CustomerFooter } from "@/components/customer/footer"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Home | Naadan" }

export default async function CustomerHomePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  return (
    <div className="min-h-screen bg-[#fdf9f1]">
      <CustomerHeader
        cartCount={0}
        activePage="home"
        userName={session.user.name}
      />

      <main className="w-full">
        {/* Hero Section with Header.jpg */}
        <div className="relative w-full h-[60vh] md:h-[70vh]">
          <Image
            src="/brand/Header.jpg"
            alt="Naadan Authentic Kerala Kitchen"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#002211]/30 via-[#002211]/20 to-[#fdf9f1]" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1
                className="text-4xl md:text-6xl font-bold text-white mb-4"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Authentic Kerala, Served Fresh
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Slow-cooked in seasoned earthen pots, wrapped in singed banana leaves. Pure heritage recipes delivered warm across Nagpur.
              </p>
              <a
                href="/menu"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#fcca66] text-[#755400] font-semibold hover:bg-[#f0bf5c] transition-colors text-lg"
              >
                <span className="material-symbols-outlined text-[24px]">restaurant</span>
                Explore Our Menu
              </a>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <section className="w-full px-4 lg:px-8 py-16 bg-[#fdf9f1]">
          <div className="max-w-7xl mx-auto text-center">
            <h2
              className="text-3xl md:text-4xl font-bold text-[#002211] mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Welcome to Naadan
            </h2>
            <p className="text-[#414942] text-lg max-w-3xl mx-auto mb-12">
              Every meal you order supports a dream, a kitchen, and a passion for great food. Thank you for being part of our journey.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {[
                {
                  icon: "soup_kitchen",
                  title: "Stone-Crushed Masalas",
                  description: "Shallots, whole black pepper, and curry leaves hand-ground on ammikallu stones."
                },
                {
                  icon: "eco",
                  title: "Cold-Pressed Coconut Oil",
                  description: "Sourced from smallholder groves in Kozhikode for uncompromised aroma."
                },
                {
                  icon: "verified",
                  title: "Zero Reheating Policy",
                  description: "Fresh batches prepared every 3 hours at our Civil Lines cloud station."
                }
              ].map((feature) => (
                <div key={feature.title} className="bg-[#ffffff] rounded-2xl p-6 shadow-sm border border-[#f1ede6]">
                  <div className="w-16 h-16 rounded-full bg-[#fcca66] flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[32px] text-[#755400]">{feature.icon}</span>
                  </div>
                  <h3 className="font-bold text-[#002211] text-lg mb-2">{feature.title}</h3>
                  <p className="text-[#717972] text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <CustomerFooter />
    </div>
  )
}