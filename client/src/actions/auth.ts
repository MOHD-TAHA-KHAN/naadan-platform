"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { Role } from "@/types/auth"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { loginSchema, signupSchema } from "@/lib/validations/auth"

export interface ActionState {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

export async function loginAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries())
  const parsed = loginSchema.safeParse(rawData)

  if (!parsed.success) return { error: "Please enter a valid email and password." }

  const { email, password } = parsed.data

  let destination = "/"
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { role: true },
    })
    if (user?.role === Role.ADMIN) destination = "/admin"
  } catch {
    return { error: "Unable to connect to the database. Check your DATABASE_URL." }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: destination })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." }
    }
    throw error
  }
}

export async function signupAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const rawData = Object.fromEntries(formData.entries())
  const parsed = signupSchema.safeParse(rawData)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    })
    return { fieldErrors, error: parsed.error.issues[0]?.message ?? "Check your inputs." }
  }

  const { name, email, password } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return { fieldErrors: { email: "Email already registered." }, error: "Email already registered." }
    }
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed, role: Role.USER },
    })
  } catch {
    return { error: "Database error while creating account." }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Please log in." }
    }
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/admin" })
}
