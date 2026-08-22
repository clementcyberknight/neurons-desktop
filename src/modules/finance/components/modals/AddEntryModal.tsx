import React from 'react'
import { FormModal } from '@/components/ui/FormModal'

export interface NewEntryFormData {
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  currency: 'NGN' | 'USD' | 'KES' | 'GHS'
}

interface AddEntryModalProps {
  open: boolean
  onClose: () => void
  newEntry: NewEntryFormData
  setNewEntry: React.Dispatch<React.SetStateAction<NewEntryFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  open,
  onClose,
  newEntry,
  setNewEntry,
  onSubmit,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title="Record Income / Expense Entry"
      submitLabel="Save Entry"
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setNewEntry({ ...newEntry, type: 'income' })}
          className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
            newEntry.type === 'income'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white border-neutral-200 text-neutral-700'
          }`}
        >
          + Income
        </button>
        <button
          type="button"
          onClick={() => setNewEntry({ ...newEntry, type: 'expense' })}
          className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
            newEntry.type === 'expense'
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white border-neutral-200 text-neutral-700'
          }`}
        >
          - Expense
        </button>
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">Category</label>
        <input
          type="text"
          value={newEntry.category}
          onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
          placeholder="e.g. Wholesale Sales, Generator Fuel, Store Rent"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">Description *</label>
        <input
          type="text"
          required
          value={newEntry.description}
          onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
          placeholder="Brief note about this transaction"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">Amount (₦) *</label>
        <input
          type="number"
          required
          min="1"
          value={newEntry.amount}
          onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm font-mono font-bold focus:bg-white focus:outline-none"
        />
      </div>
    </FormModal>
  )
}
