import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import type { StaffMember } from '@/types/database'
import { DAYS, type DayOfWeek } from '../StaffRotaBoard'

export const SHIFT_PRESETS = [
  '08:00 - 16:30 (Morning Shift)',
  '09:00 - 17:30 (Day Shift)',
  '12:00 - 20:30 (Afternoon / Evening)',
  '08:00 - 20:00 (Full Day Shift)',
  '20:00 - 08:00 (Night Shift)',
]

export interface ShiftFormData {
  staffId: string
  day: DayOfWeek
  shiftTime: string
  customTime: string
  notes: string
}

interface ShiftFormModalProps {
  open: boolean
  onClose: () => void
  isEditing: boolean
  staffList: StaffMember[]
  formData: ShiftFormData
  setFormData: React.Dispatch<React.SetStateAction<ShiftFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  open,
  onClose,
  isEditing,
  staffList,
  formData,
  setFormData,
  onSubmit,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title={isEditing ? 'Edit Shift Assignment' : 'Assign Shift to Staff'}
      subtitle="Configure day of week and operating hours"
      submitLabel={isEditing ? 'Update Shift' : 'Assign Shift'}
    >
      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Staff Member *
        </label>
        <select
          required
          value={formData.staffId}
          onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
        >
          <option value="" disabled>
            Select Staff Member
          </option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({s.role}){' '}
              {s.status !== 'active' ? `— [${s.status.toUpperCase()}]` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Day of the Week
        </label>
        <select
          value={formData.day}
          onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Shift Hours Preset
        </label>
        <select
          value={formData.shiftTime}
          onChange={(e) => setFormData({ ...formData, shiftTime: e.target.value })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
        >
          {SHIFT_PRESETS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value="Custom">Custom Time...</option>
        </select>
      </div>

      {formData.shiftTime === 'Custom' && (
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Custom Hours (e.g. 10:00 - 18:00)
          </label>
          <input
            type="text"
            required
            value={formData.customTime}
            onChange={(e) => setFormData({ ...formData, customTime: e.target.value })}
            placeholder="e.g. 10:00 - 19:00"
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-semibold focus:bg-white focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="block font-bold text-neutral-700 uppercase mb-1">
          Shift Notes / Station
        </label>
        <input
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="e.g. Opening register / Counter A"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
        />
      </div>
    </FormModal>
  )
}
