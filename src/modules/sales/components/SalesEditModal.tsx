import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import type { POSTransaction } from '@/types/database'
import { Pencil } from 'lucide-react'

export interface EditSalesFormData {
  receiptNumber: string
  cashierName: string
  posStation: string
  paymentMethod: POSTransaction['paymentMethod']
  status: POSTransaction['status']
  discountPercent: number
  overrideReason: string
}

interface SalesEditModalProps {
  transaction: POSTransaction | null
  formData: EditSalesFormData
  setFormData: React.Dispatch<React.SetStateAction<EditSalesFormData>>
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export const SalesEditModal: React.FC<SalesEditModalProps> = ({
  transaction,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  if (!transaction) return null

  return (
    <FormModal
      open={!!transaction}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title="Edit Sales Record"
      subtitle={transaction.receiptNumber}
      icon={<Pencil className="h-4 w-4 text-neutral-700" />}
      submitLabel="Save Changes"
    >
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">Receipt Number</label>
        <input
          type="text"
          required
          value={formData.receiptNumber}
          onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-semibold focus:bg-white focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">Cashier Name</label>
          <input
            type="text"
            required
            value={formData.cashierName}
            onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">POS Station</label>
          <input
            type="text"
            required
            value={formData.posStation}
            onChange={(e) => setFormData({ ...formData, posStation: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">Payment Method</label>
          <select
            value={formData.paymentMethod}
            onChange={(e) =>
              setFormData({
                ...formData,
                paymentMethod: e.target.value as POSTransaction['paymentMethod'],
              })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="cash">Cash</option>
            <option value="card">Card / POS Terminal</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="store_credit">Store Credit</option>
            <option value="split">Split Payment</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as POSTransaction['status'],
              })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="completed">Completed</option>
            <option value="flagged">Flagged Override</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">Discount % Override</label>
        <input
          type="number"
          min="0"
          max="100"
          value={formData.discountPercent}
          onChange={(e) =>
            setFormData({ ...formData, discountPercent: Number(e.target.value) })
          }
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Override Reason / Audit Note
        </label>
        <textarea
          rows={2}
          value={formData.overrideReason}
          onChange={(e) => setFormData({ ...formData, overrideReason: e.target.value })}
          placeholder="e.g. Approved bulk discount for loyalty customer"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 text-xs focus:bg-white focus:outline-none"
        />
      </div>
    </FormModal>
  )
}
