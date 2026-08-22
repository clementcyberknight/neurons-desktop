import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { StaffMember, ShiftEntry } from '@/types/database'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { StaffHeader } from './components/StaffHeader'
import { StaffFilters } from './components/StaffFilters'
import { StaffGrid } from './components/StaffGrid'
import { StaffRotaBoard, type DayOfWeek } from './components/StaffRotaBoard'
import { StaffFormModal, type StaffFormData } from './components/modals/StaffFormModal'
import { ShiftFormModal, type ShiftFormData, SHIFT_PRESETS } from './components/modals/ShiftFormModal'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const SEED_STAFF: Omit<StaffMember, 'createdAt' | 'updatedAt' | 'synced'>[] = [
  { id: 'stf-1', staffCode: 'PHC_01', fullName: 'Dr. Sarah Johnson', role: 'Licensed Pharmacist', department: 'Pharmacy', hourlyRate: 4500, monthlySalary: 450000, phone: '+234 803 123 4567', email: 'sarah.j@baucorp.com', status: 'active' },
  { id: 'stf-2', staffCode: 'PHC_02', fullName: 'Mr. David Kim', role: 'Staff Pharmacist', department: 'Pharmacy', hourlyRate: 3200, monthlySalary: 320000, phone: '+234 802 987 6543', email: 'david.k@baucorp.com', status: 'active' },
  { id: 'stf-3', staffCode: 'PHC_03', fullName: 'Ms. Clara Lee', role: 'Pharmacy Technician', department: 'Pharmacy', hourlyRate: 2200, monthlySalary: 220000, phone: '+234 814 555 0192', email: 'clara.l@baucorp.com', status: 'active' },
  { id: 'stf-4', staffCode: 'MGT_01', fullName: 'Akhimien Clement', role: 'Store Manager', department: 'Management', hourlyRate: 6000, monthlySalary: 600000, phone: '+234 809 111 2233', email: 'clement@baucorp.com', status: 'active' },
  { id: 'stf-5', staffCode: 'POS_04', fullName: 'Cashier ID #104', role: 'Cashier', department: 'Retail Floor', hourlyRate: 1800, monthlySalary: 180000, phone: '+234 818 333 4455', email: 'cashier104@baucorp.com', status: 'active' },
]

const INITIAL_STAFF_FORM: StaffFormData = {
  fullName: '',
  staffCode: '',
  role: 'Cashier',
  department: 'Retail Floor',
  monthlySalary: 180000,
  hourlyRate: 1800,
  phone: '',
  email: '',
  status: 'active',
}

const INITIAL_SHIFT_FORM: ShiftFormData = {
  staffId: '',
  day: 'Monday',
  shiftTime: SHIFT_PRESETS[0],
  customTime: '',
  notes: '',
}

export const StaffModule: React.FC<Props> = ({ searchQuery: externalSearchQuery = '' }) => {
  const [activeTab, setActiveTab] = useState<'rota' | 'directory'>('directory')
  const [searchTerm, setSearchTerm] = useState(externalSearchQuery)
  const [statusFilter, setStatusFilter] = useState<'all' | StaffMember['status']>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // In-App Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    const timer = setTimeout(() => setToastMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [])

  // Modals state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)

  // Shift Modals state
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftEntry | null>(null)

  // Live Queries
  const allStaff = useLiveQuery(() => db.staff.toArray()) || []
  const allShifts = useLiveQuery(() => db.shifts.toArray()) || []

  // Auto seed staff if empty
  useEffect(() => {
    const seed = async () => {
      const count = await db.staff.count()
      if (count === 0) {
        const now = Date.now()
        for (const s of SEED_STAFF) {
          await db.staff.add({ ...s, createdAt: now, updatedAt: now, synced: 0 })
        }
      }
    }
    seed()
  }, [])

  // Close menus on outside click - AGENTS.md §4 cleanup
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Staff Form State
  const [staffForm, setStaffForm] = useState<StaffFormData>(INITIAL_STAFF_FORM)

  // Shift Form State
  const [shiftForm, setShiftForm] = useState<ShiftFormData>(INITIAL_SHIFT_FORM)

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    let list = [...allStaff]
    const q = searchTerm.trim().toLowerCase()

    if (q) {
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.staffCode.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.phone.includes(q)
      )
    }

    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter)
    }

    if (deptFilter !== 'all') {
      list = list.filter((s) => s.department === deptFilter)
    }

    return list
  }, [allStaff, searchTerm, statusFilter, deptFilter])

  // Open Create Staff Modal
  const handleOpenCreateStaff = useCallback(() => {
    setStaffForm({
      ...INITIAL_STAFF_FORM,
      staffCode: `STF-${Math.floor(100 + Math.random() * 900)}`,
      phone: '+234 ',
    })
    setEditingStaff(null)
    setShowAddStaffModal(true)
  }, [])

  // Open Edit Staff Modal
  const handleOpenEditStaff = useCallback((member: StaffMember) => {
    setActiveMenuId(null)
    setEditingStaff(member)
    setStaffForm({
      fullName: member.fullName,
      staffCode: member.staffCode,
      role: member.role,
      department: member.department,
      monthlySalary: member.monthlySalary,
      hourlyRate: member.hourlyRate,
      phone: member.phone,
      email: member.email,
      status: member.status,
    })
    setShowAddStaffModal(true)
  }, [])

  // Save Staff (Create or Edit)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffForm.fullName.trim()) return

    const now = Date.now()

    if (editingStaff) {
      await db.staff.update(editingStaff.id, {
        fullName: staffForm.fullName,
        staffCode: staffForm.staffCode,
        role: staffForm.role,
        department: staffForm.department,
        monthlySalary: Number(staffForm.monthlySalary) || 0,
        hourlyRate: Number(staffForm.hourlyRate) || 0,
        phone: staffForm.phone,
        email: staffForm.email,
        status: staffForm.status,
        updatedAt: now,
        synced: 0,
      })
      showToast(`Updated profile for ${staffForm.fullName}.`)
    } else {
      await db.staff.add({
        id: `stf-${now}`,
        fullName: staffForm.fullName,
        staffCode: staffForm.staffCode || `STF-${Math.floor(100 + Math.random() * 900)}`,
        role: staffForm.role,
        department: staffForm.department,
        monthlySalary: Number(staffForm.monthlySalary) || 0,
        hourlyRate: Number(staffForm.hourlyRate) || 0,
        phone: staffForm.phone,
        email: staffForm.email,
        status: staffForm.status,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      })
      showToast(`Added ${staffForm.fullName} to team directory.`)
    }

    setShowAddStaffModal(false)
    setEditingStaff(null)
  }

  // Toggle Leave Status
  const handleToggleLeave = useCallback(
    async (member: StaffMember) => {
      setActiveMenuId(null)
      const nextStatus = member.status === 'on_leave' ? 'active' : 'on_leave'
      await db.staff.update(member.id, {
        status: nextStatus,
        updatedAt: Date.now(),
        synced: 0,
      })
      showToast(
        nextStatus === 'on_leave'
          ? `${member.fullName} is now marked as On Leave.`
          : `${member.fullName} has returned from leave and is Active.`
      )
    },
    [showToast]
  )

  // Toggle Suspend Status
  const handleToggleSuspend = useCallback(
    async (member: StaffMember) => {
      setActiveMenuId(null)
      const nextStatus = member.status === 'suspended' ? 'active' : 'suspended'
      await db.staff.update(member.id, {
        status: nextStatus,
        updatedAt: Date.now(),
        synced: 0,
      })
      showToast(
        nextStatus === 'suspended'
          ? `${member.fullName} has been Suspended.`
          : `${member.fullName} suspension lifted and is now Active.`
      )
    },
    [showToast]
  )

  // Delete Staff Execution
  const handleExecuteDeleteStaff = async () => {
    if (!deletingStaff) return
    const name = deletingStaff.fullName
    await db.staff.delete(deletingStaff.id)

    // Remove shift assignments for this staff
    const assigned = allShifts.filter((s) => s.staffId === deletingStaff.id)
    for (const shf of assigned) {
      await db.shifts.delete(shf.id)
    }

    setDeletingStaff(null)
    showToast(`Removed ${name} from staff directory and rota.`)
  }

  // Open Add Shift Modal for a specific day
  const handleOpenAddShift = useCallback(
    (day?: DayOfWeek) => {
      const selectedDay = day || 'Monday'
      const firstStaff = allStaff.find((s) => s.status === 'active') || allStaff[0]
      setShiftForm({
        staffId: firstStaff ? firstStaff.id : '',
        day: selectedDay,
        shiftTime: SHIFT_PRESETS[0],
        customTime: '',
        notes: '',
      })
      setEditingShift(null)
      setShowShiftModal(true)
    },
    [allStaff]
  )

  // Open Edit Shift Modal
  const handleOpenEditShift = useCallback((shift: ShiftEntry) => {
    setEditingShift(shift)
    const isPreset = SHIFT_PRESETS.some((p) => p.includes(shift.shiftTime))
    setShiftForm({
      staffId: shift.staffId,
      day: shift.day,
      shiftTime: isPreset ? shift.shiftTime : 'Custom',
      customTime: isPreset ? '' : shift.shiftTime,
      notes: shift.notes || '',
    })
    setShowShiftModal(true)
  }, [])

  // Save Shift (Create or Edit)
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shiftForm.staffId) {
      showToast('Please select a staff member.')
      return
    }

    const assignedStaff = allStaff.find((s) => s.id === shiftForm.staffId)
    if (!assignedStaff) return

    const now = Date.now()
    const finalShiftTime =
      shiftForm.shiftTime === 'Custom' && shiftForm.customTime.trim()
        ? shiftForm.customTime.trim()
        : shiftForm.shiftTime.split(' ')[0]

    if (editingShift) {
      await db.shifts.update(editingShift.id, {
        staffId: assignedStaff.id,
        staffName: assignedStaff.fullName,
        role: assignedStaff.role,
        day: shiftForm.day,
        shiftTime: finalShiftTime,
        notes: shiftForm.notes,
        updatedAt: now,
        synced: 0,
      })
      showToast(`Updated shift for ${assignedStaff.fullName} on ${shiftForm.day}.`)
    } else {
      await db.shifts.add({
        id: `shf-${now}`,
        weekStarting: new Date().toISOString().split('T')[0],
        staffId: assignedStaff.id,
        staffName: assignedStaff.fullName,
        role: assignedStaff.role,
        day: shiftForm.day,
        shiftTime: finalShiftTime,
        isCovered: true,
        notes: shiftForm.notes,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      })
      showToast(`Assigned ${assignedStaff.fullName} to ${shiftForm.day} (${finalShiftTime}).`)
    }

    setShowShiftModal(false)
    setEditingShift(null)
  }

  // Delete Shift Assignment
  const handleDeleteShift = useCallback(
    async (shiftId: string, staffName: string, day: string) => {
      await db.shifts.delete(shiftId)
      showToast(`Removed shift for ${staffName} on ${day}.`)
    },
    [showToast]
  )

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar relative">
      {/* In-App Toast Notification */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      {/* 1. Header Bar & Tab Switcher */}
      <StaffHeader
        totalStaffCount={allStaff.length}
        totalShiftsCount={allShifts.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCreateStaff={handleOpenCreateStaff}
        onOpenAssignShift={() => handleOpenAddShift('Monday')}
      />

      {/* 2. Main Content Area */}
      {activeTab === 'directory' ? (
        <div className="space-y-4 flex-1">
          <StaffFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            deptFilter={deptFilter}
            onDeptFilterChange={setDeptFilter}
          />

          <StaffGrid
            staffList={filteredStaff}
            activeMenuId={activeMenuId}
            onToggleMenu={(id) => setActiveMenuId(activeMenuId === id ? null : id)}
            onEdit={handleOpenEditStaff}
            onToggleLeave={handleToggleLeave}
            onToggleSuspend={handleToggleSuspend}
            onDelete={(m) => {
              setActiveMenuId(null)
              setDeletingStaff(m)
            }}
          />
        </div>
      ) : (
        <StaffRotaBoard
          shifts={allShifts}
          onOpenAddShift={handleOpenAddShift}
          onOpenEditShift={handleOpenEditShift}
          onDeleteShift={handleDeleteShift}
        />
      )}

      {/* MODAL 1: Add / Edit Staff Profile */}
      <StaffFormModal
        open={showAddStaffModal}
        onClose={() => {
          setShowAddStaffModal(false)
          setEditingStaff(null)
        }}
        isEditing={Boolean(editingStaff)}
        formData={staffForm}
        setFormData={setStaffForm}
        onSubmit={handleSaveStaff}
      />

      {/* MODAL 2: Delete Staff Confirmation */}
      <ConfirmDeleteModal
        open={!!deletingStaff}
        title="Remove Staff Member?"
        description={
          deletingStaff ? (
            <p>
              Are you sure you want to remove{' '}
              <strong className="text-neutral-900">{deletingStaff.fullName}</strong> (
              {deletingStaff.role}) from the team directory?
              <span className="text-[11px] text-red-600 block mt-2 font-medium">
                All assigned weekly shifts will also be unassigned.
              </span>
            </p>
          ) : null
        }
        confirmLabel="Delete Staff"
        onConfirm={handleExecuteDeleteStaff}
        onCancel={() => setDeletingStaff(null)}
      />

      {/* MODAL 3: Assign / Edit Shift */}
      <ShiftFormModal
        open={showShiftModal}
        onClose={() => {
          setShowShiftModal(false)
          setEditingShift(null)
        }}
        isEditing={Boolean(editingShift)}
        staffList={allStaff}
        formData={shiftForm}
        setFormData={setShiftForm}
        onSubmit={handleSaveShift}
      />
    </div>
  )
}
export default StaffModule
