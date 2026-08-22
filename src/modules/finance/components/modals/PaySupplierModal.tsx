import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import type { SupplierPayableRecord } from '@/types/database'

interface PaySupplierModalProps {
  payable: SupplierPayableRecord | null
  paymentAmount: number
  setPaymentAmount: (amount: number) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export const PaySupplierModal: React.FC<PaySupplierModalProps> = ({
  payable,
  paymentAmount,
  setPaymentAmount,
  onClose,
  onSubmit,
}) => {
  if (!payable) return null

  return (
    <FormModal
      open={!!payable}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title="Make Payment to Supplier"
      subtitle={payable.supplierName}
      submitLabel="Disburse Payment"
      submitVariant="red"
    >
      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center text-xs">
        <div>
          <span className="text-neutral-500 block">Total Balance Due</span>
          <strong className="text-sm font-mono text-red-600">
            ₦{payable.balanceDue.toLocaleString()}
          </strong>
        </div>
        <div className="text-right">
          <span className="text-neutral-500 block">Already Paid</span>
          <strong className="text-sm font-mono text-emerald-600">
            ₦{payable.amountPaid.toLocaleString()}
          </strong>
        </div>
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Payment Amount to Disburse (₦) *
        </label>
        <input
          type="number"
          required
          min="1"
          max={payable.balanceDue}
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(Number(e.target.value))}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm font-mono font-bold focus:bg-white focus:outline-none"
        />
      </div>
    </FormModal>
  )
}
