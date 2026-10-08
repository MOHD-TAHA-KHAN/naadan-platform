"use client"

import { useEffect } from "react"

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold text-[#ba1a1a] mb-2">Admin Portal Error</h2>
      <p className="text-sm text-[#717972] mb-4">An error occurred while loading admin operations.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#ba1a1a] text-white text-sm font-semibold rounded-lg hover:bg-[#ba1a1a]/90 transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  )
}
