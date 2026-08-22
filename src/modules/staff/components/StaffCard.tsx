import React from 'react'
import type { StaffMember } from '@/types/database'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Phone,
  Palmtree,
  Ban,
} from 'lucide-react'

interface StaffCardProps {
  member: StaffMember
  isMenuOpen: boolean
  onToggleMenu: (id: string) => void
  onEdit: (member: StaffMember) => void
  onToggleLeave: (member: StaffMember) => void
  onToggleSuspend: (member: StaffMember) => void
  onDelete: (member: StaffMember) => void
}

export const StaffCard: React.FC<StaffCardProps> = ({
  member,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onToggleLeave,
  onToggleSuspend,
  onDelete,
}) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between relative group">
      {/* Top Profile & Role */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar Circle */}
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-900 font-extrabold text-sm">
            {member.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-neutral-900 leading-tight">
                {member.fullName}
              </h4>
            </div>
            <span className="text-xs text-neutral-500 font-medium">{member.role}</span>
          </div>
        </div>

        {/* Right Badges & Three-Dot Menu */}
        <div className="flex items-center gap-1.5 relative">
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-mono font-bold text-neutral-700 border border-neutral-200">
            {member.department}
          </span>

          {/* Three-Dot Menu Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMenu(member.id)
            }}
            className={`p-1 rounded-lg border transition-all cursor-pointer ${
              isMenuOpen
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white hover:bg-neutral-100 text-neutral-500 border-neutral-200'
            }`}
            title="Staff Options"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white border border-neutral-200 shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100 text-xs">
              {/* Edit Profile */}
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                <span>Edit Profile</span>
              </button>

              {/* Toggle Leave */}
              <button
                type="button"
                onClick={() => onToggleLeave(member)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
              >
                <Palmtree className="h-3.5 w-3.5 text-amber-600" />
                <span>
                  {member.status === 'on_leave' ? 'Return from Leave' : 'Put on Leave'}
                </span>
              </button>

              {/* Toggle Suspend */}
              <button
                type="button"
                onClick={() => onToggleSuspend(member)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5 text-red-500" />
                <span>
                  {member.status === 'suspended' ? 'Lift Suspension' : 'Suspend Staff'}
                </span>
              </button>

              <div className="my-1 border-t border-neutral-100" />

              {/* Delete Staff */}
              <button
                type="button"
                onClick={() => onDelete(member)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Delete Staff</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Indicator Pill if Not Active */}
      {member.status !== 'active' && (
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
              member.status === 'on_leave'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-red-100 text-red-900 border border-red-300'
            }`}
          >
            {member.status === 'on_leave' ? (
              <Palmtree className="h-2.5 w-2.5" />
            ) : (
              <Ban className="h-2.5 w-2.5" />
            )}
            {member.status === 'on_leave' ? 'On Leave' : 'Suspended'}
          </span>
        </div>
      )}

      {/* Payroll & Contact Details */}
      <div className="mt-4 space-y-1.5 text-xs text-neutral-600 border-t border-neutral-100 pt-3">
        <div className="flex items-center justify-between font-mono">
          <span className="text-neutral-500">Monthly Payroll:</span>
          <span className="font-extrabold text-neutral-900">
            ₦{member.monthlySalary.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center justify-between font-mono">
          <span className="text-neutral-500">Hourly Rate:</span>
          <span className="text-neutral-700 font-semibold">
            ₦{member.hourlyRate.toLocaleString()}/hr
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
            <span>{member.phone || 'No phone'}</span>
          </div>
          <span className="text-[10px] uppercase">{member.staffCode}</span>
        </div>
      </div>
    </div>
  )
}
