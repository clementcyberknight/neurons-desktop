import React from 'react'
import { Plus } from 'lucide-react'

interface InventoryHeaderProps {
  onOpenCreate: () => void
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({ onOpenCreate }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="text-base font-bold text-neutral-900 tracking-tight">Inventory Catalog</h3>
        <p className="text-xs text-neutral-500">
          Live warehouse stock tracking across finished goods, raw materials, and sales channels
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenCreate}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add Stock Item</span>
      </button>
    </div>
  )
}
