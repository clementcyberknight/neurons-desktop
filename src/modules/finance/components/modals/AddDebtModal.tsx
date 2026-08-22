import React from 'react'
import { FormModal } from '@/components/ui/FormModal'

export interface NewDebtFormData {
  customerName: string
  customerPhone: string
  description: string
  totalAmount: number
  dueDate: string
}

interface AddDebtModalProps {
  open: boolean
  onClose: () => void
  newDebt: NewDebtFormData
  setNewDebt: React.Dispatch<React.SetStateAction<NewDebtFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  open,
  onClose,
  newDebt,
  setNewDebt,
  onSubmit,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title="Record Customer Credit / Debt"
      submitLabel="Record Debt"
    >
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Customer Name *
        </label>
        <input
          type="text"
          required
          value={newDebt.customerName}
          onChange={(e) => setNewDebt({ ...newDebt, customerName: e.target.value })}
          placeholder="e.g. Chief Okafor / Beta Construction"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Phone Number
        </label>
        <input
          type="text"
          value={newDebt.customerPhone}
          onChange={(e) => setNewDebt({ ...newDebt, customerPhone: e.target.value })}
          placeholder="e.g. +234 803 123 4567"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Goods Supplied / Note
        </label>
        <input
          type="text"
          value={newDebt.description}
          onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
          placeholder="e.g. 5 Drums Paint & Brushes"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Total Credit (₦) *
          </label>
          <input
            type="number"
            required
            min="1"
            value={newDebt.totalAmount}
            onChange={(e) => setNewDebt({ ...newDebt, totalAmount: Number(e.target.value) })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={newDebt.dueDate}
            onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>
    </FormModal>
  )
}
