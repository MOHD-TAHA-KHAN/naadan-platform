export default function AnalyticsLoading() {
  return (
    <div className="flex min-h-screen bg-[#fdf9f1]">
      <div className="pl-64 flex-1">
        <div className="pt-16 p-6 min-h-screen space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-[#e6e2da] rounded w-1/3 mb-4" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#ffffff] rounded-xl p-4 border border-[#f1ede6]">
                  <div className="h-4 bg-[#e6e2da] rounded w-1/2 mb-2" />
                  <div className="h-8 bg-[#e6e2da] rounded w-3/4" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[#ffffff] rounded-xl p-4 border border-[#f1ede6]">
                  <div className="h-12 bg-[#e6e2da] rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-[#ffffff] rounded-xl p-5 border border-[#f1ede6]">
                <div className="h-6 bg-[#e6e2da] rounded w-1/3 mb-4" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2 mb-3">
                    <div className="h-4 bg-[#e6e2da] rounded w-3/4" />
                    <div className="h-2 bg-[#f1ede6] rounded" />
                  </div>
                ))}
              </div>
              <div className="bg-[#ffffff] rounded-xl p-5 border border-[#f1ede6]">
                <div className="h-6 bg-[#e6e2da] rounded w-1/3 mb-4" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2 mb-3">
                    <div className="h-4 bg-[#e6e2da] rounded w-3/4" />
                    <div className="h-2 bg-[#f1ede6] rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}