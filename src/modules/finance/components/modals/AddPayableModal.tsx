import React from 'react'
import { FormModal } from '@/components/ui/FormModal'

export interface NewPayableFormData {
  supplierName: string
  supplierPhone: string
  itemName: string
  totalAmount: number
  dueDate: string
}

interface AddPayableModalProps {
  open: boolean
  onClose: () => void
  newPayable: NewPayableFormData
  setNewPayable: React.Dispatch<React.SetStateAction<NewPayableFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const AddPayableModal: React.FC<AddPayableModalProps> = ({
  open,
  onClose,
  newPayable,
  setNewPayable,
  onSubmit,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title="Record Supplier Restock Credit"
      submitLabel="Record Payable"
    >
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Supplier Name *
        </label>
        <input
          type="text"
          required
          value={newPayable.supplierName}
          onChange={(e) => setNewPayable({ ...newPayable, supplierName: e.target.value })}
          placeholder="e.g. Emzor / Chi Limited / Local Drum Supplier"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Item / Batch Supplied
        </label>
        <input
          type="text"
          value={newPayable.itemName}
          onChange={(e) => setNewPayable({ ...newPayable, itemName: e.target.value })}
          placeholder="e.g. 50 Cartons Antibiotics"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Amount Owed (₦) *
          </label>
          <input
            type="number"
            required
            min="1"
            value={newPayable.totalAmount}
            onChange={(e) => setNewPayable({ ...newPayable, totalAmount: Number(e.target.value) })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Payment Due Date
          </label>
          <input
            type="date"
            value={newPayable.dueDate}
            onChange={(e) => setNewPayable({ ...newPayable, dueDate: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>
    </FormModal>
  )
}
