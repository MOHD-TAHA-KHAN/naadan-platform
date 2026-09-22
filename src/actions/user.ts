"use server"

import { auth } from "../../auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ActionState {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

export async function updateUserProfile(formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Please log in first." }
  }

  const file = formData.get("profilePic") as File
  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  let imageUrl: string | null = null

  if (file && file.size > 0) {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error("Supabase upload error:", uploadError)
        return { error: "Failed to upload image." }
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(uploadData.path)

      imageUrl = publicUrl
    } catch (error) {
      console.error("Image upload error:", error)
      return { error: "Failed to upload image." }
    }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() || null }),
        ...(address !== undefined && { address: address.trim() || null }),
        ...(imageUrl !== null && { image: imageUrl }),
      },
    })

    revalidatePath("/profile")
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Profile update error:", error)
    return { error: "Failed to update profile." }
  }
}
