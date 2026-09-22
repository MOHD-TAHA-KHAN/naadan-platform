"use client"

import { useState } from "react"
import { useTransition } from "react"
import { updateInventoryStock, updateInventoryBuffer, deleteInventoryItem } from "@/actions/inventory"

interface InventoryRowProps {
  item: {
    id: string
    name: string
    unit: string
    current: number
    buffer: number
    supplier: string | null
    status: string
  }
}

export function InventoryRow({ item }: InventoryRowProps) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<"current" | "buffer" | null>(null)
  const [tempValue, setTempValue] = useState(item.current.toString())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OUT_OF_STOCK": return "bg-[#ba1a1a] text-white"
      case "CRITICAL": return "bg-[#f97316] text-white"
      case "LOW_STOCK": return "bg-[#fbbf24] text-[#755400]"
      default: return "bg-[#4ade80] text-[#002211]"
    }
  }

  const calculateStatus = (current: number, buffer: number) => {
    if (current === 0) return "OUT_OF_STOCK"
    if (current < buffer) return "CRITICAL"
    if (current < buffer * 1.5) return "LOW_STOCK"
    return "IN_STOCK"
  }

  const handleSave = () => {
    const value = parseFloat(tempValue)
    if (isNaN(value) || value < 0) return

    startTransition(async () => {
      const result = editing === "current" 
        ? await updateInventoryStock(item.id, value)
        : await updateInventoryBuffer(item.id, value)
      
      if (result.success) {
        setEditing(null)
      } else {
        setTempValue(editing === "current" ? item.current.toString() : item.buffer.toString())
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") {
      setTempValue(editing === "current" ? item.current.toString() : item.buffer.toString())
      setEditing(null)
    }
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteInventoryItem(item.id)
      if (result.success) {
        setShowDeleteConfirm(false)
      }
    })
  }

  const currentStatus = calculateStatus(item.current, item.buffer)
  const progressPercent = Math.min((item.current / (item.buffer * 2)) * 100, 100)

  return (
    <div className="bg-[#ffffff] rounded-xl p-4 border border-[#f1ede6] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#002211] mb-1">{item.name}</h3>
          <p className="text-xs text-[#717972] mb-2">
            {item.supplier || "No supplier"} • {item.unit}
          </p>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#717972]">Current:</span>
              {editing === "current" ? (
                <input
                  type="number"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyPress}
                  className="w-20 px-2 py-1 text-sm border border-[#f1ede6] rounded focus:outline-none focus:border-[#fcca66]"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setEditing("current")
                    setTempValue(item.current.toString())
                  }}
                  className="font-mono text-sm font-semibold text-[#002211] hover:text-[#7b5900] transition-colors"
                >
                  {item.current}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#717972]">Buffer:</span>
              {editing === "buffer" ? (
                <input
                  type="number"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyPress}
                  className="w-20 px-2 py-1 text-sm border border-[#f1ede6] rounded focus:outline-none focus:border-[#fcca66]"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setEditing("buffer")
                    setTempValue(item.buffer.toString())
                  }}
                  className="font-mono text-sm font-semibold text-[#002211] hover:text-[#7b5900] transition-colors"
                >
                  {item.buffer}
                </button>
              )}
            </div>
          </div>

          <div className="h-2 rounded-full bg-[#f1ede6] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                currentStatus === "OUT_OF_STOCK" ? "bg-[#ba1a1a]" :
                currentStatus === "CRITICAL" ? "bg-[#f97316]" :
                currentStatus === "LOW_STOCK" ? "bg-[#fbbf24]" : "bg-[#4ade80]"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(currentStatus)}`}>
            {currentStatus.replace(/_/g, " ")}
          </span>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="text-[10px] text-[#ba1a1a] hover:underline disabled:opacity-40"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-[10px] font-semibold text-[#ba1a1a] hover:underline disabled:opacity-40"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-[10px] text-[#717972] hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}