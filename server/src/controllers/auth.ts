import type { Request, Response } from "express"
import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import { prisma } from "../db/prisma"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required." })
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      res.status(404).json({ error: "User with this email does not exist." })
      return
    }

    // 1. Generate a secure random token using crypto.randomBytes(32)
    const rawToken = crypto.randomBytes(32).toString("hex")

    // 2. Hash this token before saving it to the database with a 15-minute expiration
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpires,
      },
    })

    // 3. Send raw, unhashed token in an email with link pointing to http://localhost:3000/reset-password?token=[raw_token]
    const resetLink = `http://localhost:3000/reset-password?token=${rawToken}`

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Naadan Support" <noreply@naadan.com>',
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #033921; margin-top: 0;">Reset Your Password</h2>
          <p>Hello ${user.name || "Customer"},</p>
          <p>You requested a password reset. Click the button below to choose a new password. This link is valid for <strong>15 minutes</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #033921; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">Direct link: <a href="${resetLink}" style="color: #033921;">${resetLink}</a></p>
        </div>
      `,
    })

    res.status(200).json({ success: true, message: "Password reset link sent to your email." })
  } catch (error) {
    console.error("[auth] forgot-password failed:", error)
    res.status(500).json({ error: "Failed to process forgot password request." })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password, newPassword } = req.body
  const targetPassword = password || newPassword

  if (!token || typeof token !== "string" || !targetPassword || typeof targetPassword !== "string") {
    res.status(400).json({ error: "Token and new password are required." })
    return
  }

  if (targetPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters long." })
    return
  }

  try {
    // 1. Verify the incoming token by hashing it and checking match + expiry
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      res.status(400).json({ error: "Invalid or expired password reset token." })
      return
    }

    // 2. Hash the new password using bcryptjs
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(targetPassword, salt)

    // 3. Update database record and nullify reset fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    })

    res.status(200).json({ success: true, message: "Password has been reset successfully." })
  } catch (error) {
    console.error("[auth] reset-password failed:", error)
    res.status(500).json({ error: "Failed to reset password." })
  }
}
