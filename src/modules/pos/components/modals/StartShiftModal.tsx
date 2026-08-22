import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import { Unlock } from 'lucide-react'

interface StartShiftModalProps {
  open: boolean
  onClose: () => void
  cashierName: string
  setCashierName: (name: string) => void
  posStation: string
  setPosStation: (station: string) => void
  onStartShift: (e: React.FormEvent) => void
}

export const StartShiftModal: React.FC<StartShiftModalProps> = ({
  open,
  onClose,
  cashierName,
  setCashierName,
  posStation,
  setPosStation,
  onStartShift,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onStartShift}
      maxWidth="md"
      title="Open Cashier Shift"
      subtitle="Activate register & select operator"
      icon={
        <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center">
          <Unlock className="h-5 w-5" />
        </div>
      }
      submitLabel="START SHIFT & OPEN REGISTER"
    >
      <div>
        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
          Cashier Name / Operator *
        </label>
        <input
          type="text"
          required
          value={cashierName}
          onChange={(e) => setCashierName(e.target.value)}
          placeholder="Enter Cashier Name"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
        />
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
          POS Station Terminal
        </label>
        <input
          type="text"
          value={posStation}
          onChange={(e) => setPosStation(e.target.value)}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-700 focus:bg-white focus:outline-none"
        />
      </div>
    </FormModal>
  )
}
