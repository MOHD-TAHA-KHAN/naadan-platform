import Link from "next/link"

export function CustomerFooter() {
  return (
    <footer className="bg-[#033921] text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Tagline */}
          <div className="lg:col-span-1">
            <h3
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Authentic Kerala, served fresh
            </h3>
            <p className="text-[#baefcb] text-sm leading-relaxed">
              Every meal you order supports a dream, a kitchen, and a passion for great food. Thank you for being part of our journey.
            </p>
          </div>

          {/* About */}
          <div>
            <h4 className="font-bold text-[#fcca66] mb-4">About</h4>
            <p className="text-[#baefcb] text-sm leading-relaxed">
              Every meal you order supports a dream, a kitchen, and a passion for great food. Thank you for being part of our journey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[#fcca66] mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/menu" className="text-[#baefcb] hover:text-[#fcca66] text-sm transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-[#baefcb] hover:text-[#fcca66] text-sm transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-[#baefcb] hover:text-[#fcca66] text-sm transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="font-bold text-[#fcca66] mb-4">Contact & Legal</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#baefcb] font-medium mb-1">Address</p>
                <p className="text-[#baefcb]/80">
                  Sharma & Saraf Groups, Tekdi Road, Opposite Sadar Muslim Library, Sadar, Nagpur -440001
                </p>
              </div>
              <div>
                <p className="text-[#baefcb] font-medium mb-1">Phone</p>
                <p className="text-[#baefcb]/80">8855988875</p>
              </div>
              <div>
                <p className="text-[#baefcb] font-medium mb-1">FSSAI Lic.</p>
                <p className="text-[#baefcb]/80">11523034000492</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-4 mb-8 pt-8 border-t border-[#fdf9f1]/10">
          <a
            href="https://instagram.com/naadanindia"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-10 h-10 rounded-full bg-[#fcca66] flex items-center justify-center hover:bg-[#f0bf5c] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-[#755400] hover:text-[#002211] transition-colors"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="WhatsApp"
            className="w-10 h-10 rounded-full bg-[#fcca66] flex items-center justify-center hover:bg-[#f0bf5c] transition-colors"
          >
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-[#755400] hover:text-[#002211] transition-colors"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.05 2zm5.81 14.1c-.24.68-1.41 1.32-1.94 1.4-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36h.56c.18 0 .42-.03.65.5.24.55.82 1.9.89 2.04.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.17-.19.7-.82.89-1.1.19-.28.37-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
            </svg>
          </a>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#fdf9f1]/10 text-center">
          <p className="text-[#baefcb]/80 text-xs">
            © 2026 Naadan Cloud Kitchen, Nagpur. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}