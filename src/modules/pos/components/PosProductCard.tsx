import React from 'react'
import type { InventoryItem } from '@/types/database'
import { ColorWheelIcon } from './ColorWheelIcon'

interface PosProductCardProps {
  product: InventoryItem
  isInCart: boolean
  onAddToCart: (item: InventoryItem) => void
}

export const PosProductCard: React.FC<PosProductCardProps> = ({
  product,
  isInCart,
  onAddToCart,
}) => {
  const isOut = product.quantity <= 0
  const isLow = product.quantity > 0 && product.quantity <= product.minThreshold

  return (
    <button
      type="button"
      onClick={() => onAddToCart(product)}
      className={`group relative rounded-2xl border p-3 text-left transition-all flex flex-col justify-between h-44 cursor-pointer ${
        isInCart
          ? 'border-black ring-2 ring-black/15 bg-neutral-100/70 shadow-sm'
          : isOut
          ? 'border-neutral-200 bg-white opacity-70 hover:border-neutral-300'
          : 'border-neutral-200 bg-white hover:border-black hover:shadow-md'
      }`}
    >
      {/* Top Image / Status Badge */}
      <div className="relative w-full flex items-center justify-center h-20 mb-2">
        {/* Badge: Out of stock / Low */}
        {isOut ? (
          <span className="absolute top-0 text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
            OUT OF STOCK
          </span>
        ) : isLow ? (
          <span className="absolute top-0 right-0 text-[10px] font-bold text-white bg-black px-1.5 py-0.2 rounded-full uppercase">
            Low
          </span>
        ) : null}

        {/* Image or Color Wheel */}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-16 w-16 object-cover rounded-xl"
          />
        ) : (
          <div className="transition-transform group-hover:scale-105">
            <ColorWheelIcon className="h-16 w-16" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div>
        <h4 className="text-xs font-bold text-black line-clamp-2 leading-tight">
          {product.name}
        </h4>

        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-xs font-bold font-mono text-black">
            ₦{product.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span
            className={`text-[11px] font-mono font-semibold ${
              isOut ? 'text-neutral-400' : 'text-neutral-900'
            }`}
          >
            {product.quantity}
          </span>
        </div>
      </div>
    </button>
  )
}
