import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import type { StaffMember } from '@/types/database'
import { DEPARTMENTS, DEFAULT_ROLES } from '../StaffFilters'

export interface StaffFormData {
  fullName: string
  staffCode: string
  role: string
  department: string
  monthlySalary: number
  hourlyRate: number
  phone: string
  email: string
  status: StaffMember['status']
}

interface StaffFormModalProps {
  open: boolean
  onClose: () => void
  isEditing: boolean
  formData: StaffFormData
  setFormData: React.Dispatch<React.SetStateAction<StaffFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  open,
  onClose,
  isEditing,
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
      title={isEditing ? 'Edit Staff Profile' : 'Add New Team Member'}
      subtitle="Enter personal details, role, department, and payroll rates"
      submitLabel={isEditing ? 'Save Changes' : 'Add Staff'}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Dr. Sarah Johnson"
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Staff Code / ID
          </label>
          <input
            type="text"
            value={formData.staffCode}
            onChange={(e) => setFormData({ ...formData, staffCode: e.target.value })}
            placeholder="e.g. PHC_01"
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Role / Title *
          </label>
          <input
            type="text"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="e.g. Cashier, Pharmacist"
            list="staff-roles-list"
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
          />
          <datalist id="staff-roles-list">
            {DEFAULT_ROLES.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">Department</label>
          <select
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Monthly Salary (₦)
          </label>
          <input
            type="number"
            min="0"
            value={formData.monthlySalary}
            onChange={(e) =>
              setFormData({ ...formData, monthlySalary: Number(e.target.value) })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Hourly Rate (₦/hr)
          </label>
          <input
            type="number"
            min="0"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+234 803 123 4567"
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-neutral-700 uppercase mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as StaffMember['status'],
              })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </FormModal>
  )
}
