import React from 'react'
import type { StaffMember } from '@/types/database'
import { Search, Filter } from 'lucide-react'

export const DEPARTMENTS = [
  'Pharmacy',
  'Retail Floor',
  'Warehouse',
  'Management',
  'Administration',
]

export const DEFAULT_ROLES = [
  'Licensed Pharmacist',
  'Staff Pharmacist',
  'Pharmacy Technician',
  'Store Manager',
  'Cashier',
  'Sales Associate',
  'Inventory Auditor',
  'Supervisor',
]

interface StaffFiltersProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  statusFilter: 'all' | StaffMember['status']
  onStatusFilterChange: (val: 'all' | StaffMember['status']) => void
  deptFilter: string
  onDeptFilterChange: (val: string) => void
}

export const StaffFilters: React.FC<StaffFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  deptFilter,
  onDeptFilterChange,
}) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search staff name, code, role, or phone..."
            className="h-9 w-full rounded-xl bg-neutral-50 border border-neutral-200 pl-9 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as 'all' | StaffMember['status'])
            }
            className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Department Filter */}
        <select
          value={deptFilter}
          onChange={(e) => onDeptFilterChange(e.target.value)}
          className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none cursor-pointer"
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
