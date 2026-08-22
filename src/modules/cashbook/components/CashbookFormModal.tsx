import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import type { FinanceRecord } from '@/types/database'
import { ArrowDown, ArrowUp, Plus, Pencil } from 'lucide-react'

const CASHBOOK_TAGS = [
  'SALES',
  'RESTOCK',
  'PAYROLL',
  'EXPENSE',
  'CAPITAL',
  'UTILITIES',
  'REFUND',
  'MISC',
] as const

export interface CashbookFormData {
  type: 'income' | 'expense'
  description: string
  tag: string
  date: string
  amount: number
  referenceId: string
  paymentType: 'Cash' | 'Bank Transfer' | 'Card'
}

interface CashbookFormModalProps {
  open: boolean
  onClose: () => void
  editingRecord: FinanceRecord | null
  formData: CashbookFormData
  setFormData: React.Dispatch<React.SetStateAction<CashbookFormData>>
  onSave: (e: React.FormEvent) => void
}

export const CashbookFormModal: React.FC<CashbookFormModalProps> = ({
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
      icon={
        <div className="text-[#f97316]">
          {editingRecord ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </div>
      }
      title={editingRecord ? 'Edit Cashbook Entry' : 'New Cashbook Transaction'}
      subtitle="Record debit inflow or credit payment disbursement"
      submitLabel={editingRecord ? 'Save Changes' : 'Record Transaction'}
      submitVariant="orange"
    >
      {/* Type Switcher (Debit vs Credit) */}
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          TRANSACTION TYPE *
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income', tag: 'SALES' })}
            className={`rounded-xl py-2.5 px-3 font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              formData.type === 'income'
                ? 'bg-blue-50 border-blue-400 text-[#2563eb] shadow-xs'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-white'
            }`}
          >
            <ArrowDown className="h-4 w-4" />
            <span>Debit (Receipt / Inflow)</span>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense', tag: 'EXPENSE' })}
            className={`rounded-xl py-2.5 px-3 font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              formData.type === 'expense'
                ? 'bg-red-50 border-red-400 text-[#ef4444] shadow-xs'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-white'
            }`}
          >
            <ArrowUp className="h-4 w-4" />
            <span>Credit (Payment / Outflow)</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          DESCRIPTION *
        </label>
        <input
          type="text"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g. POS Shift Reconciled / Generator Fuel"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none"
        />
      </div>

      {/* Tag & Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            LEDGER TAG
          </label>
          <select
            value={formData.tag}
            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
          >
            {CASHBOOK_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
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

      {/* Amount & Reference */}
      <div className="grid grid-cols-2 gap-3">
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

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            REFERENCE / TICKET NO.
          </label>
          <input
            type="text"
            value={formData.referenceId}
            onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
            placeholder="e.g. REC-88B5"
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 text-xs font-mono focus:bg-white focus:outline-none"
          />
        </div>
      </div>
    </FormModal>
  )
}
