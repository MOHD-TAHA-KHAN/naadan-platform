"use client"

import { useTransition } from "react"
import { removeFromCart, updateCartQty } from "../../actions/cart"
import Image from "next/image"

interface CartItemRowProps {
  cartItem: {
    id: string
    quantity: number
    menuItem: {
      id: string
      name: string
      description: string | null
      price: { toString(): string }
      imageUrl: string | null
    }
  }
}

export function CartItemRow({ cartItem }: CartItemRowProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-4 pt-4 first:pt-0">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f1ede6] shrink-0 relative">
        {cartItem.menuItem.imageUrl ? (
          <Image
            src={cartItem.menuItem.imageUrl}
            alt={cartItem.menuItem.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-[#c0c9c0]">restaurant</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#002211] truncate">{cartItem.menuItem.name}</p>
        <p className="text-xs text-[#717972] mt-0.5">₹{Number(cartItem.menuItem.price).toFixed(0)} each</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => startTransition(async () => { await updateCartQty(cartItem.id, cartItem.quantity - 1) })}
          disabled={isPending}
          className="w-7 h-7 rounded-full bg-[#f1ede6] hover:bg-[#ebe8e0] flex items-center justify-center transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[16px] text-[#002211]">remove</span>
        </button>
        <span className="w-6 text-center font-semibold text-sm text-[#002211]">{cartItem.quantity}</span>
        <button
          onClick={() => startTransition(async () => { await updateCartQty(cartItem.id, cartItem.quantity + 1) })}
          disabled={isPending}
          className="w-7 h-7 rounded-full bg-[#f1ede6] hover:bg-[#ebe8e0] flex items-center justify-center transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[16px] text-[#002211]">add</span>
        </button>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-sm text-[#002211]">
          ₹{(Number(cartItem.menuItem.price) * cartItem.quantity).toFixed(0)}
        </p>
        <button
          onClick={() => startTransition(async () => { await removeFromCart(cartItem.id) })}
          disabled={isPending}
          className="text-[10px] text-[#ba1a1a] hover:underline mt-0.5 disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
