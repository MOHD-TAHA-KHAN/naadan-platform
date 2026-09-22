export default function OrdersLoading() {
  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <div className="pl-64 flex-1">
        <div className="pt-16 p-6 min-h-screen">
          <div className="animate-pulse">
            <div className="h-8 bg-[#e6e2da] rounded w-1/3 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-[#ffffff] rounded-xl p-4 border border-[#f1ede6]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-[#e6e2da] rounded w-1/4" />
                    <div className="h-6 bg-[#e6e2da] rounded w-1/6" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#e6e2da] rounded w-3/4" />
                    <div className="h-4 bg-[#e6e2da] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}