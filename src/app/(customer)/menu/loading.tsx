export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[#fdf9f1]">
      <div className="w-full pt-[calc(4rem+2.5rem)] md:pt-[calc(4rem+2.5rem+1.5rem)] px-4 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#e6e2da] rounded w-1/3" />
            <div className="h-4 bg-[#e6e2da] rounded w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[#ffffff] rounded-2xl p-4 border border-[#f1ede6]">
                  <div className="h-52 bg-[#f1ede6] rounded-xl mb-4" />
                  <div className="h-6 bg-[#e6e2da] rounded w-3/4 mb-2" />
                  <div className="h-4 bg-[#e6e2da] rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}