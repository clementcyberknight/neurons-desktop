import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import type { FinanceRecord } from '@/types/database'
import { EXPENSE_TYPES, PAYMENT_TYPES, PAYMENT_STATUSES } from './ExpenseFilters'
import iconPayment from '@/assets/icons-pack/Money-Trend--Streamline-Plump.png'

export interface ExpenseFormData {
  expensePurpose: string
  beneficiary: string
  expenseType: string
  date: string
  amount: number
  paymentType: (typeof PAYMENT_TYPES)[number]
  paymentStatus: (typeof PAYMENT_STATUSES)[number]
}

interface ExpenseFormModalProps {
  open: boolean
  onClose: () => void
  editingRecord: FinanceRecord | null
  formData: ExpenseFormData
  setFormData: React.Dispatch<React.SetStateAction<ExpenseFormData>>
  onSave: (e: React.FormEvent) => void
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  open,
  onClose,
  editingRecord,
  formData,
  setFormData,
  onSave,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSave}
      maxWidth="lg"
      icon={<img src={iconPayment} alt="Expense" className="h-6 w-6 object-contain" />}
      title={editingRecord ? 'Edit Expense Record' : 'New Expense Record'}
      subtitle="Fill in the details to document a business expense."
      submitLabel={editingRecord ? 'Save Changes' : 'Save Expense Record'}
      submitVariant="black"
    >
      {/* Field 1: EXPENSE PURPOSE */}
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          EXPENSE PURPOSE *
        </label>
        <input
          type="text"
          required
          value={formData.expensePurpose}
          onChange={(e) => setFormData({ ...formData, expensePurpose: e.target.value })}
          placeholder="e.g. Fuel for generator"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
        />
      </div>

      {/* Field 2: PAID TO (BENEFICIARY) */}
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          PAID TO (BENEFICIARY)
        </label>
        <input
          type="text"
          value={formData.beneficiary}
          onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
          placeholder="Recipient name"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
        />
      </div>

      {/* Field 3: EXPENSE TYPE & Field 4: DATE */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            EXPENSE TYPE
          </label>
          <select
            value={formData.expenseType}
            onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
          >
            {EXPENSE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            DATE
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-mono font-semibold focus:bg-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Field 5: AMOUNT (₦) */}
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          AMOUNT (₦) *
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-mono font-extrabold text-neutral-900 focus:bg-white focus:outline-none"
        />
      </div>

      {/* Field 6: PAYMENT TYPE & Field 7: PAYMENT STATUS */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            PAYMENT TYPE
          </label>
          <select
            value={formData.paymentType}
            onChange={(e) =>
              setFormData({
                ...formData,
                paymentType: e.target.value as (typeof PAYMENT_TYPES)[number],
              })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
          >
            {PAYMENT_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            PAYMENT STATUS
          </label>
          <select
            value={formData.paymentStatus}
            onChange={(e) =>
              setFormData({
                ...formData,
                paymentStatus: e.target.value as (typeof PAYMENT_STATUSES)[number],
              })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
          >
            {PAYMENT_STATUSES.map((ps) => (
              <option key={ps} value={ps}>
                {ps}
              </option>
            ))}
          </select>
        </div>
      </div>
    </FormModal>
  )
}
