import React from 'react'
import { FormModal } from '@/components/ui/FormModal'

export interface NewInvoiceFormData {
  customerName: string
  customerPhone: string
  itemDesc: string
  quantity: number
  unitPrice: number
  dueDate: string
  notes: string
}

interface CreateInvoiceModalProps {
  open: boolean
  onClose: () => void
  newInvoice: NewInvoiceFormData
  setNewInvoice: React.Dispatch<React.SetStateAction<NewInvoiceFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  open,
  onClose,
  newInvoice,
  setNewInvoice,
  onSubmit,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="lg"
      title="Create Wholesale Customer Invoice"
      submitLabel="Generate Invoice"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Customer / Business Name *
          </label>
          <input
            type="text"
            required
            value={newInvoice.customerName}
            onChange={(e) => setNewInvoice({ ...newInvoice, customerName: e.target.value })}
            placeholder="e.g. Apex Hospital Ikeja"
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Customer Phone
          </label>
          <input
            type="text"
            value={newInvoice.customerPhone}
            onChange={(e) => setNewInvoice({ ...newInvoice, customerPhone: e.target.value })}
            placeholder="+234 803..."
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Item / Product Supplied *
        </label>
        <input
          type="text"
          required
          value={newInvoice.itemDesc}
          onChange={(e) => setNewInvoice({ ...newInvoice, itemDesc: e.target.value })}
          placeholder="e.g. 10 Drums Army Green (Drum 0012)"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={newInvoice.quantity}
            onChange={(e) => setNewInvoice({ ...newInvoice, quantity: Number(e.target.value) })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">Unit Price (₦) *</label>
          <input
            type="number"
            required
            min="1"
            value={newInvoice.unitPrice}
            onChange={(e) => setNewInvoice({ ...newInvoice, unitPrice: Number(e.target.value) })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">Payment Due Date</label>
          <input
            type="date"
            value={newInvoice.dueDate}
            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Payment Instructions / Bank Details
        </label>
        <textarea
          rows={2}
          value={newInvoice.notes}
          onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 text-xs focus:bg-white focus:outline-none"
        />
      </div>
    </FormModal>
  )
}
