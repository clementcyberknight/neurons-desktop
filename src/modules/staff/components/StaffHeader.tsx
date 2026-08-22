import React from 'react'
import { Calendar, Users, Plus } from 'lucide-react'

interface StaffHeaderProps {
  totalStaffCount: number
  totalShiftsCount: number
  activeTab: 'rota' | 'directory'
  onTabChange: (tab: 'rota' | 'directory') => void
  onOpenCreateStaff: () => void
  onOpenAssignShift: () => void
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({
  totalStaffCount,
  totalShiftsCount,
  activeTab,
  onTabChange,
  onOpenCreateStaff,
  onOpenAssignShift,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
          Staff Operations & Shift Rota
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          {totalStaffCount} team members • {totalShiftsCount} active shift assignments for week
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-neutral-200/80 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onTabChange('rota')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
              activeTab === 'rota'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Shift Rota</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('directory')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Staff Directory</span>
          </button>
        </div>

        {activeTab === 'directory' ? (
          <button
            type="button"
            onClick={onOpenCreateStaff}
            className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAssignShift}
            className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Assign Shift</span>
          </button>
        )}
      </div>
    </div>
  )
}
