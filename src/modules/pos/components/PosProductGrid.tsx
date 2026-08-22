import React from 'react'
import type { InventoryItem } from '@/types/database'
import { PosProductCard } from './PosProductCard'

interface PosProductGridProps {
  products: InventoryItem[]
  cart: { item: InventoryItem; quantity: number }[]
  onAddToCart: (item: InventoryItem) => void
}

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  products,
  cart,
  onAddToCart,
}) => {
  if (products.length === 0) {
    return (
      <div className="p-12 text-center text-neutral-400 bg-white rounded-2xl border border-dashed border-neutral-300">
        <p className="text-sm font-semibold text-neutral-700">No products match your search</p>
        <p className="text-xs text-neutral-400 mt-1">
          Try searching for paint colors like "Army Green", "Ash Grey", or "Beige".
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {products.map((p) => {
        const inCart = cart.some((c) => c.item.id === p.id)
        return (
          <PosProductCard
            key={p.id}
            product={p}
            isInCart={inCart}
            onAddToCart={onAddToCart}
          />
        )
      })}
    </div>
  )
}
