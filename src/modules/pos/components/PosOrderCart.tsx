import React from 'react'
import type { InventoryItem } from '@/types/database'
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react'

export interface CartItem {
  item: InventoryItem
  quantity: number
}

interface PosOrderCartProps {
  cart: CartItem[]
  totalCartCount: number
  onClearCart: () => void
  onUpdateQty: (itemId: string, delta: number) => void
  onRemoveFromCart: (itemId: string) => void
}

export const PosOrderCart: React.FC<PosOrderCartProps> = ({
  cart,
  totalCartCount,
  onClearCart,
  onUpdateQty,
  onRemoveFromCart,
}) => {
  return (
    <>
      {/* Order Header */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-black text-sm">
          <ShoppingCart className="h-4 w-4 text-black" />
          <span>Order</span>
          <span className="rounded-full bg-black text-white text-xs px-2 py-0.2 font-mono font-bold">
            {totalCartCount}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearCart}
          className="text-xs font-semibold text-neutral-500 hover:text-black hover:underline cursor-pointer"
        >
          Clear
        </button>
      </div>

      {/* Order Cart Items List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 divide-y divide-neutral-100 no-scrollbar min-h-[160px]">
        {cart.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-xs">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30 text-neutral-400" />
            <p className="font-semibold text-neutral-700">Your order is empty</p>
            <p className="mt-0.5">Click items on the left catalog to add to cart.</p>
          </div>
        ) : (
          cart.map(({ item, quantity }) => (
            <div
              key={item.id}
              className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex-1 truncate">
                <h5 className="font-bold text-black truncate leading-snug">{item.name}</h5>
                <span className="text-[11px] text-neutral-500 font-mono">
                  ₦{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} each
                </span>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                  title="Decrease"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-7 text-center font-bold font-mono text-black">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, 1)}
                  className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                  title="Increase"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Line Total */}
              <div className="font-mono font-bold text-black text-right min-w-[75px]">
                ₦
                {(item.unitPrice * quantity).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>

              <button
                type="button"
                onClick={() => onRemoveFromCart(item.id)}
                className="text-neutral-400 hover:text-black p-0.5 cursor-pointer"
                title="Remove item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  )
}
