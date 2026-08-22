import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { Landmark } from 'lucide-react'

export interface NewBankFormData {
  bankName: string
  accountNumber: string
  accountName: string
  balance: number
  accountType: 'bank' | 'pos_terminal' | 'cash_vault'
}

interface AddBankModalProps {
  open: boolean
  onClose: () => void
  newBank: NewBankFormData
  setNewBank: React.Dispatch<React.SetStateAction<NewBankFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const AddBankModal: React.FC<AddBankModalProps> = ({
  open,
  onClose,
  newBank,
  setNewBank,
  onSubmit,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title="Add Account / Bank"
      icon={<Landmark className="h-5 w-5 text-neutral-700" />}
      submitLabel="Save Account"
    >
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Bank / Institution Name *
        </label>
        <input
          type="text"
          required
          value={newBank.bankName}
          onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
          placeholder="e.g. Access Bank, OPay Merchant, Moniepoint"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Account Number
        </label>
        <input
          type="text"
          value={newBank.accountNumber}
          onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
          placeholder="e.g. 0123456789"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Account Type
        </label>
        <select
          value={newBank.accountType}
          onChange={(e) =>
            setNewBank({
              ...newBank,
              accountType: e.target.value as 'bank' | 'pos_terminal' | 'cash_vault',
            })
          }
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none cursor-pointer"
        >
          <option value="bank">Commercial Bank</option>
          <option value="pos_terminal">POS Terminal / Merchant Till</option>
          <option value="cash_vault">Physical Safe / Cash Drawer</option>
        </select>
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Current Balance (₦)
        </label>
        <input
          type="number"
          min="0"
          value={newBank.balance}
          onChange={(e) => setNewBank({ ...newBank, balance: Number(e.target.value) })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm font-mono font-bold focus:bg-white focus:outline-none"
        />
      </div>
    </FormModal>
  )
}
