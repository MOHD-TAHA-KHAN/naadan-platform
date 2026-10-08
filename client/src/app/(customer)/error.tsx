"use client"

import { useEffect } from "react"

export default function ErrorBoundary({
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
      <h2 className="text-xl font-bold text-[#002211] mb-2">Something went wrong!</h2>
      <p className="text-sm text-[#717972] mb-4">An unexpected error occurred while loading this page.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#002211] text-white text-sm font-semibold rounded-lg hover:bg-[#002211]/90 transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  )
}
