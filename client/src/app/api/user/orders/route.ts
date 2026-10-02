import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(req.url)
    const queryFingerprint = searchParams.get("fingerprint")
    const cookieFingerprint = req.cookies.get("naadan_device_id")?.value
    const fingerprint = queryFingerprint || cookieFingerprint

    const userId = session?.user?.id

    if (!userId && !fingerprint) {
      return NextResponse.json(
        { error: "Authentication or device fingerprint required to view order history." },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(fingerprint ? [{ deviceFingerprint: fingerprint }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true, imageUrl: true },
            },
          },
        },
        review: true,
      },
    })

    const serialized = orders.map((o) => {
      let deliveryAddressText = o.address || ""
      let customerPhone = ""
      let distanceKm: string | undefined

      try {
        if (o.address?.startsWith("{")) {
          const parsed = JSON.parse(o.address)
          deliveryAddressText = parsed?.drop?.address || o.address
          customerPhone = parsed?.drop?.phone || ""
          distanceKm = parsed?.distanceKm
        }
      } catch {
        // use raw
      }

      return {
        id: o.id,
        orderNumber: o.id.slice(-6).toUpperCase(),
        totalPrice: Number(o.totalPrice),
        deliveryFee: Number(o.deliveryFee),
        status: o.status,
        rejectReason: o.rejectReason,
        address: deliveryAddressText,
        customerPhone,
        distanceKm,
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((i) => ({
          id: i.id,
          menuItemId: i.menuItemId,
          name: i.nameAtOrder || i.menuItem?.name || "Dish",
          quantity: i.quantity,
          price: Number(i.priceAtOrder || i.menuItem?.price || 0),
          imageUrl: i.menuItem?.imageUrl,
        })),
        review: o.review,
      }
    })

    return NextResponse.json({ orders: serialized })
  } catch (err) {
    console.error("[api/user/orders] GET error:", err)
    return NextResponse.json(
      { error: "Failed to fetch order history." },
      { status: 500 }
    )
  }
}
