"use client"

import { useState } from "react"
import { useTransition } from "react"
import { addInventoryItem } from "../../actions/inventory"

export function AddItemPanel() {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    current: "",
    buffer: "",
    supplier: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.current || !formData.buffer) return

    startTransition(async () => {
      const result = await addInventoryItem({
        name: formData.name,
        unit: formData.unit,
        current: parseFloat(formData.current),
        buffer: parseFloat(formData.buffer),
        supplier: formData.supplier || undefined,
      })

      if (result.success) {
        setFormData({ name: "", unit: "kg", current: "", buffer: "", supplier: "" })
        setIsOpen(false)
      }
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-[#033921] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#002211] transition-colors flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        Add New Inventory Item
      </button>
    )
  }

  return (
    <div className="bg-[#ffffff] rounded-xl p-6 border border-[#f1ede6] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
          Add New Inventory Item
        </h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[#717972] hover:text-[#002211] transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#717972] mb-1">Item Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#f1ede6] rounded-lg focus:outline-none focus:border-[#fcca66] text-sm"
              placeholder="e.g., Rice (Kaima)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#717972] mb-1">Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-[#f1ede6] rounded-lg focus:outline-none focus:border-[#fcca66] text-sm bg-white"
            >
              <option value="kg">kg</option>
              <option value="litres">litres</option>
              <option value="pieces">pieces</option>
              <option value="bunches">bunches</option>
              <option value="sheets">sheets</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#717972] mb-1">Current Stock</label>
            <input
              type="number"
              step="0.1"
              value={formData.current}
              onChange={(e) => setFormData({ ...formData, current: e.target.value })}
              className="w-full px-3 py-2 border border-[#f1ede6] rounded-lg focus:outline-none focus:border-[#fcca66] text-sm"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#717972] mb-1">Buffer/Minimum</label>
            <input
              type="number"
              step="0.1"
              value={formData.buffer}
              onChange={(e) => setFormData({ ...formData, buffer: e.target.value })}
              className="w-full px-3 py-2 border border-[#f1ede6] rounded-lg focus:outline-none focus:border-[#fcca66] text-sm"
              placeholder="0"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#717972] mb-1">Supplier (Optional)</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3 py-2 border border-[#f1ede6] rounded-lg focus:outline-none focus:border-[#fcca66] text-sm"
              placeholder="e.g., Wayanad Rice Mills"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-[#033921] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#002211] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Adding..." : "Add Item"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-lg border border-[#f1ede6] text-[#717972] hover:bg-[#f7f3eb] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}