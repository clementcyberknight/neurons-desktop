import React from 'react'
import type { StaffMember } from '@/types/database'
import { StaffCard } from './StaffCard'
import { Users } from 'lucide-react'

interface StaffGridProps {
  staffList: StaffMember[]
  activeMenuId: string | null
  onToggleMenu: (id: string) => void
  onEdit: (member: StaffMember) => void
  onToggleLeave: (member: StaffMember) => void
  onToggleSuspend: (member: StaffMember) => void
  onDelete: (member: StaffMember) => void
}

export const StaffGrid: React.FC<StaffGridProps> = ({
  staffList,
  activeMenuId,
  onToggleMenu,
  onEdit,
  onToggleLeave,
  onToggleSuspend,
  onDelete,
}) => {
  if (staffList.length === 0) {
    return (
      <div className="p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs font-bold text-neutral-700">No staff members found matching filters</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">Click "Add Staff" above to create a team member.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {staffList.map((member) => (
        <StaffCard
          key={member.id}
          member={member}
          isMenuOpen={activeMenuId === member.id}
          onToggleMenu={onToggleMenu}
          onEdit={onEdit}
          onToggleLeave={onToggleLeave}
          onToggleSuspend={onToggleSuspend}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
