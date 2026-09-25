export function KdsBoardIntro() {
  return (
    <section className="mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#033921] text-[#ffdea4] text-[10px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fcca66] animate-ping" />
              Live Board
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
            Kitchen Display System
          </h2>
          <p className="text-[13px] text-[#717972] mt-0.5">
            Real-time order flow — click any ticket status toggle to advance the stage. Tabs auto-sync across every admin browser.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-[11px] text-[#717972]">Pipeline</span>
          <div className="flex items-center gap-2 mt-1">
            {["New", "Confirmed", "Cooking", "Out"].map((s, i) => (
              <span key={s} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#38684c]" />
                <span className="text-[10px] font-semibold text-[#002211]">{s}</span>
                {i < 3 && <span className="text-[#b9c4bb] mx-1">›</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
