import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import type { InventoryItem } from '@/types/database'
import { PackagePlus } from 'lucide-react'

interface RestockModalProps {
  item: InventoryItem | null
  restockQty: number
  setRestockQty: (qty: number) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export const RestockModal: React.FC<RestockModalProps> = ({
  item,
  restockQty,
  setRestockQty,
  onClose,
  onSubmit,
}) => {
  if (!item) return null

  return (
    <FormModal
      open={!!item}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title="Restock Product"
      subtitle={item.name}
      icon={
        <div className="h-8 w-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
          <PackagePlus className="h-4 w-4" />
        </div>
      }
      submitLabel="CONFIRM RESTOCK"
    >
      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 flex justify-between items-center text-xs">
        <div>
          <span className="text-neutral-500 block">Current In-Stock</span>
          <strong className="text-sm font-mono text-neutral-900">
            {item.quantity} {item.unit}
          </strong>
        </div>
        <div className="text-right">
          <span className="text-neutral-500 block">New Total After Restock</span>
          <strong className="text-sm font-mono text-emerald-600">
            {item.quantity + Number(restockQty || 0)} {item.unit}
          </strong>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
          Quantity to Add ({item.unit})
        </label>
        <input
          type="number"
          required
          min="1"
          value={restockQty}
          onChange={(e) => setRestockQty(Number(e.target.value))}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm text-neutral-900 font-mono font-bold focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
          autoFocus
        />
      </div>

      <div className="flex items-center gap-2">
        {[10, 25, 50, 100, 250].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setRestockQty(preset)}
            className="flex-1 py-1 rounded-lg border border-neutral-200 text-xs font-semibold hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            +{preset}
          </button>
        ))}
      </div>
    </FormModal>
  )
}
