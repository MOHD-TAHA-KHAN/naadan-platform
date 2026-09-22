export default function CartLoading() {
  return (
    <div className="min-h-screen bg-[#fdf9f1]">
      <div className="w-full pt-[calc(4rem+2.5rem)] md:pt-[calc(4rem+2.5rem+1.5rem)] px-4 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#e6e2da] rounded w-1/3" />
            <div className="h-4 bg-[#e6e2da] rounded w-1/2" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <div className="bg-[#ffffff] rounded-2xl p-6">
                  <div className="h-6 bg-[#e6e2da] rounded w-1/4 mb-4" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 pt-4">
                      <div className="w-16 h-16 bg-[#f1ede6] rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#e6e2da] rounded w-3/4" />
                        <div className="h-3 bg-[#e6e2da] rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="bg-[#ffffff] rounded-2xl p-6">
                  <div className="h-6 bg-[#e6e2da] rounded w-1/3 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 bg-[#e6e2da] rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}