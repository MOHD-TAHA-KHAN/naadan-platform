export default function InventoryLoading() {
  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <div className="pl-64 flex-1">
        <div className="pt-16 p-6 min-h-screen space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-[#e6e2da] rounded w-1/3 mb-6" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#ffffff] rounded-xl p-4 border border-[#f1ede6]">
                  <div className="h-4 bg-[#e6e2da] rounded w-1/2 mb-2" />
                  <div className="h-8 bg-[#e6e2da] rounded w-3/4" />
                </div>
              ))}
            </div>
            <div className="h-6 bg-[#e6e2da] rounded w-1/4 mt-6 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[#ffffff] rounded-xl p-4 border border-[#f1ede6]">
                  <div className="h-4 bg-[#e6e2da] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[#e6e2da] rounded w-1/2 mb-2" />
                  <div className="h-2 bg-[#f1ede6] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}