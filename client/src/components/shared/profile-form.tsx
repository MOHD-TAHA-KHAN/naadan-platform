"use client"

import { useTransition, useState } from "react"
import { updateUserProfile } from "../../actions/user"

interface ProfileFormProps {
  initialData?: {
    name?: string
    phone?: string | null
    address?: string | null
    image?: string | null
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.image || null)

  function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string
    if (!name?.trim()) {
      setError("Please enter your name.")
      return
    }
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateUserProfile(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form action={handleSubmit} className="bg-[#ffffff] rounded-2xl shadow-sm p-6 flex flex-col gap-4">
      <h3 className="font-bold text-[#002211]" style={{ fontFamily: "Playfair Display, serif" }}>
        Profile Information
      </h3>

      {/* Avatar */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Profile Picture
        </label>
        <div className="flex items-start gap-4">
          {previewImage && (
            <img
              src={previewImage}
              alt="Profile preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#c0c9c0]"
            />
          )}
          <div className="flex-1">
            <input
              type="file"
              name="profilePic"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-[#414942] file:mr-4 file:rounded-md file:border-0 file:bg-[#fcca66] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#755400] hover:file:bg-[#f0bf5c] cursor-pointer"
            />
            <p className="text-xs text-[#717972] mt-1">
              Accepted formats: JPEG, PNG, WebP. Max size: 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={initialData?.name || ""}
          placeholder="John Doe"
          required
          className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialData?.phone || ""}
          placeholder="+91 98765 43210"
          className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all"
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-[#717972] mb-1.5">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          defaultValue={initialData?.address || ""}
          rows={3}
          placeholder="Flat 402, Nilgiri Heights, Ramdaspeth, Nagpur - 440010"
          className="w-full px-3.5 py-2.5 rounded-lg border border-[#c0c9c0] bg-[#fdf9f1] text-[#1c1c17] placeholder:text-[#717972]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#7b5900] focus:border-transparent transition-all resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-[#93000a] bg-[#ffdad6] px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-xs text-[#38684c] bg-[#dff0d8] px-3 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          Profile updated successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#033921] hover:bg-[#002211] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            Saving...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[16px]">save</span>
            Save Changes
          </>
        )}
      </button>
    </form>
  )
}
