"use client"

import { useState, useTransition } from "react"
import { saveUserAddress, deleteUserAddress, type SaveAddressInput } from "@/actions/address"
import type { SavedAddressType } from "@/context/CartContext"

interface SavedAddressesManagerProps {
  initialAddresses: SavedAddressType[]
}

export function SavedAddressesManager({ initialAddresses }: SavedAddressesManagerProps) {
  const [addresses, setAddresses] = useState<SavedAddressType[]>(initialAddresses)
  const [isPending, startTransition] = useTransition()
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state for adding an address
  const [label, setLabel] = useState("Home")
  const [flatDetails, setFlatDetails] = useState("")
  const [street, setStreet] = useState("")
  const [fullAddress, setFullAddress] = useState("")
  const [lat, setLat] = useState("21.1458")
  const [lng, setLng] = useState("79.0882")
  const [isDefault, setIsDefault] = useState(false)

  function handleAddAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!flatDetails.trim() || !fullAddress.trim()) {
      setError("Flat/house details and full address are required.")
      return
    }

    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError("Please provide valid coordinates.")
      return
    }

    setError(null)
    startTransition(async () => {
      const payload: SaveAddressInput = {
        label,
        flatDetails: flatDetails.trim(),
        street: street.trim() || undefined,
        fullAddress: fullAddress.trim(),
        lat: parsedLat,
        lng: parsedLng,
        isDefault,
      }

      const res = await saveUserAddress(payload)
      if (res.error) {
        setError(res.error)
      } else if (res.address) {
        setAddresses((prev) => [res.address as any, ...prev])
        setSuccess("Address saved successfully!")
        setIsAddingNew(false)
        setFlatDetails("")
        setStreet("")
        setFullAddress("")
        setTimeout(() => setSuccess(null), 3000)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this address?")) return
    startTransition(async () => {
      const res = await deleteUserAddress(id)
      if (res.error) {
        setError(res.error)
      } else {
        setAddresses((prev) => prev.filter((a) => a.id !== id))
        setSuccess("Address removed.")
        setTimeout(() => setSuccess(null), 3000)
      }
    })
  }

  return (
    <div className="bg-[#ffffff] rounded-2xl shadow-sm p-6 border border-[#f1ede6] mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
            Saved Delivery Addresses
          </h2>
          <p className="text-xs text-[#717972] mt-0.5">
            Quickly select these addresses during checkout for instant location &amp; pricing detection.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fcca66] hover:bg-[#f0bf5c] text-[#755400] text-xs font-bold transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isAddingNew ? "close" : "add_location_alt"}
          </span>
          <span>{isAddingNew ? "Cancel" : "Add Address"}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-[#93000a] bg-[#ffdad6] px-3 py-2 rounded-lg mb-4">
          <span className="material-symbols-outlined text-[14px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-xs text-[#033921] bg-[#baefcb]/40 px-3 py-2 rounded-lg mb-4">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* New Address Form */}
      {isAddingNew && (
        <form onSubmit={handleAddAddress} className="bg-[#fcf8f2] p-4 rounded-xl border border-[#c0c9c0]/40 mb-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#7b5900]">
            Add New Saved Address
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#717972] mb-1">
                Label / Tag
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17]"
              >
                <option value="Home">Home</option>
                <option value="Work">Work / Office</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#717972] mb-1">
                Flat / House / Floor No.
              </label>
              <input
                type="text"
                required
                placeholder="Flat 402, 4th Floor"
                value={flatDetails}
                onChange={(e) => setFlatDetails(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#717972] mb-1">
                Landmark / Street (Optional)
              </label>
              <input
                type="text"
                placeholder="Near Shankar Nagar Square"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#717972] mb-1">
              Full Street Address
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ramdaspeth, Nagpur, Maharashtra - 440010"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#717972] mb-1">
                Latitude Coordinate
              </label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#717972] mb-1">
                Longitude Coordinate
              </label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#c0c9c0] bg-white text-[#1c1c17]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#002211] cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-[#c0c9c0] text-[#033921] focus:ring-[#033921]"
              />
              <span>Set as default delivery address</span>
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-[#033921] hover:bg-[#002211] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      )}

      {/* Address Cards List */}
      {addresses.length === 0 ? (
        <div className="text-center py-8 text-[#717972]">
          <span className="material-symbols-outlined text-[36px] text-[#c0c9c0] block mb-2">
            location_off
          </span>
          <p className="text-sm font-medium">No saved addresses yet</p>
          <p className="text-xs mt-0.5">
            Add your frequent delivery locations for fast 1-click checkout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-4 rounded-xl border border-[#f1ede6] bg-[#fbf7ee]/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#033921] text-white text-[10px] font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[12px]">
                      {addr.label.toLowerCase() === "work" ? "business" : "home"}
                    </span>
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-[#7b5900] bg-[#fcca66]/40 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-bold text-sm text-[#002211]">{addr.flatDetails}</p>
                {addr.street && <p className="text-xs text-[#414942]">{addr.street}</p>}
                <p className="text-xs text-[#717972] mt-1 line-clamp-2">{addr.fullAddress}</p>
                <p className="text-[10px] font-mono text-[#7b5900] mt-1">
                  GPS: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#f1ede6]">
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  disabled={isPending}
                  className="text-xs text-[#ba1a1a] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
