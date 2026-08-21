import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { StaffMember, ShiftEntry } from '@/types/database'
import {
  Users,
  Calendar,
  Clock,
  UserCheck,
  Phone,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  Filter,
  X,
  Palmtree,
  Ban,
} from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
type DayOfWeek = typeof DAYS[number]

const SHIFT_PRESETS = [
  '08:00 - 16:30 (Morning Shift)',
  '09:00 - 17:30 (Day Shift)',
  '12:00 - 20:30 (Afternoon / Evening)',
  '08:00 - 20:00 (Full Day Shift)',
  '20:00 - 08:00 (Night Shift)',
]

const DEPARTMENTS = ['Pharmacy', 'Retail Floor', 'Warehouse', 'Management', 'Administration']
const DEFAULT_ROLES = [
  'Licensed Pharmacist',
  'Staff Pharmacist',
  'Pharmacy Technician',
  'Store Manager',
  'Cashier',
  'Sales Associate',
  'Inventory Auditor',
  'Supervisor',
]

// Fallback seed staff if DB empty
const SEED_STAFF: Omit<StaffMember, 'createdAt' | 'updatedAt' | 'synced'>[] = [
  { id: 'stf-1', staffCode: 'PHC_01', fullName: 'Dr. Sarah Johnson', role: 'Licensed Pharmacist', department: 'Pharmacy', hourlyRate: 4500, monthlySalary: 450000, phone: '+234 803 123 4567', email: 'sarah.j@baucorp.com', status: 'active' },
  { id: 'stf-2', staffCode: 'PHC_02', fullName: 'Mr. David Kim', role: 'Staff Pharmacist', department: 'Pharmacy', hourlyRate: 3200, monthlySalary: 320000, phone: '+234 802 987 6543', email: 'david.k@baucorp.com', status: 'active' },
  { id: 'stf-3', staffCode: 'PHC_03', fullName: 'Ms. Clara Lee', role: 'Pharmacy Technician', department: 'Pharmacy', hourlyRate: 2200, monthlySalary: 220000, phone: '+234 814 555 0192', email: 'clara.l@baucorp.com', status: 'active' },
  { id: 'stf-4', staffCode: 'MGT_01', fullName: 'Akhimien Clement', role: 'Store Manager', department: 'Management', hourlyRate: 6000, monthlySalary: 600000, phone: '+234 809 111 2233', email: 'clement@baucorp.com', status: 'active' },
  { id: 'stf-5', staffCode: 'POS_04', fullName: 'Cashier ID #104', role: 'Cashier', department: 'Retail Floor', hourlyRate: 1800, monthlySalary: 180000, phone: '+234 818 333 4455', email: 'cashier104@baucorp.com', status: 'active' },
]

export const StaffModule: React.FC<Props> = ({ searchQuery: externalSearchQuery = '' }) => {
  const [activeTab, setActiveTab] = useState<'rota' | 'directory'>('directory')
  const [searchTerm, setSearchTerm] = useState(externalSearchQuery)
  const [statusFilter, setStatusFilter] = useState<'all' | StaffMember['status']>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // In-App Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Modals state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)

  // Shift Modals state
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftEntry | null>(null)
  const [targetDayForNewShift, setTargetDayForNewShift] = useState<DayOfWeek>('Monday')

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

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Staff Form State
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    staffCode: '',
    role: 'Cashier',
    department: 'Retail Floor',
    monthlySalary: 180000,
    hourlyRate: 1800,
    phone: '',
    email: '',
    status: 'active' as StaffMember['status'],
  })

  // Shift Form State
  const [shiftForm, setShiftForm] = useState({
    staffId: '',
    day: 'Monday' as DayOfWeek,
    shiftTime: SHIFT_PRESETS[0],
    customTime: '',
    notes: '',
  })

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
  const handleOpenCreateStaff = () => {
    setStaffForm({
      fullName: '',
      staffCode: `STF-${Math.floor(100 + Math.random() * 900)}`,
      role: 'Cashier',
      department: 'Retail Floor',
      monthlySalary: 180000,
      hourlyRate: 1800,
      phone: '+234 ',
      email: '',
      status: 'active',
    })
    setEditingStaff(null)
    setShowAddStaffModal(true)
  }

  // Open Edit Staff Modal
  const handleOpenEditStaff = (member: StaffMember) => {
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
  }

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
  const handleToggleLeave = async (member: StaffMember) => {
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
  }

  // Toggle Suspend Status
  const handleToggleSuspend = async (member: StaffMember) => {
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
  }

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
  const handleOpenAddShift = (day?: DayOfWeek) => {
    const selectedDay = day || targetDayForNewShift || 'Monday'
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
  }

  // Open Edit Shift Modal
  const handleOpenEditShift = (shift: ShiftEntry) => {
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
  }

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
  const handleDeleteShift = async (shiftId: string, staffName: string, day: string) => {
    await db.shifts.delete(shiftId)
    showToast(`Removed shift for ${staffName} on ${day}.`)
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar relative">
      {/* In-App Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-neutral-900 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-neutral-700 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Staff Operations & Shift Rota</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {allStaff.length} team members • {allShifts.length} active shift assignments for week
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-neutral-200/80 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('rota')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                activeTab === 'rota' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Shift Rota</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                activeTab === 'directory' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Staff Directory</span>
            </button>
          </div>

          {activeTab === 'directory' ? (
            <button
              onClick={handleOpenCreateStaff}
              className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Staff</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddShift('Monday')}
              className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Assign Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content Area */}
      {activeTab === 'directory' ? (
        /* STAFF DIRECTORY VIEW */
        <div className="space-y-4 flex-1">
          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | StaffMember['status'])}
                  className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none"
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
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none"
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

          {/* Staff Cards Grid (Matches User Reference Screenshot) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((member) => {
              const isMenuOpen = activeMenuId === member.id

              return (
                <div
                  key={member.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs hover:border-neutral-300 transition-all flex flex-col justify-between relative group"
                >
                  {/* Top Profile & Role */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar Circle */}
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-900 font-extrabold text-sm">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-neutral-900 leading-tight">{member.fullName}</h4>
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
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuId(isMenuOpen ? null : member.id)
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
                            onClick={() => handleOpenEditStaff(member)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                            <span>Edit Profile</span>
                          </button>

                          {/* Toggle Leave */}
                          <button
                            onClick={() => handleToggleLeave(member)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                          >
                            <Palmtree className="h-3.5 w-3.5 text-amber-600" />
                            <span>{member.status === 'on_leave' ? 'Return from Leave' : 'Put on Leave'}</span>
                          </button>

                          {/* Toggle Suspend */}
                          <button
                            onClick={() => handleToggleSuspend(member)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
                          >
                            <Ban className="h-3.5 w-3.5 text-red-500" />
                            <span>{member.status === 'suspended' ? 'Lift Suspension' : 'Suspend Staff'}</span>
                          </button>

                          <div className="my-1 border-t border-neutral-100" />

                          {/* Delete Staff */}
                          <button
                            onClick={() => {
                              setActiveMenuId(null)
                              setDeletingStaff(member)
                            }}
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
                        {member.status === 'on_leave' ? <Palmtree className="h-2.5 w-2.5" /> : <Ban className="h-2.5 w-2.5" />}
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
            })}
          </div>

          {filteredStaff.length === 0 && (
            <div className="p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold text-neutral-700">No staff members found matching filters</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Click "Add Staff" above to create a team member.</p>
            </div>
          )}
        </div>
      ) : (
        /* SHIFT ROTA BOARD VIEW */
        <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col justify-between overflow-x-auto shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Weekly Shift Assignment Rota</h3>
            <span className="text-xs text-neutral-500 font-mono">{allShifts.length} total shifts scheduled</span>
          </div>

          <div className="grid grid-cols-7 gap-3 min-w-[900px] flex-1">
            {DAYS.map((day) => {
              const dayShifts = allShifts.filter((s) => s.day === day)
              return (
                <div key={day} className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3 flex flex-col justify-between">
                  <div>
                    {/* Day Column Header */}
                    <div className="border-b border-neutral-200 pb-2 mb-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">{day}</h4>
                        <span className="text-[10px] font-mono text-neutral-500">{dayShifts.length} assigned</span>
                      </div>
                      <button
                        onClick={() => handleOpenAddShift(day)}
                        className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-600 hover:text-black transition-colors cursor-pointer"
                        title={`Assign shift for ${day}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Shifts List for Day */}
                    <div className="space-y-2">
                      {dayShifts.length === 0 ? (
                        <div className="h-28 flex flex-col items-center justify-center text-[10px] text-neutral-400 italic">
                          <span>No shifts</span>
                        </div>
                      ) : (
                        dayShifts.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-xl border border-neutral-200 bg-white p-2.5 text-xs shadow-2xs space-y-1 relative group hover:border-neutral-400 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 font-bold text-neutral-900 truncate">
                                <UserCheck className="h-3 w-3 text-neutral-700 shrink-0" />
                                <span className="truncate">{s.staffName}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenEditShift(s)}
                                  className="p-0.5 text-neutral-400 hover:text-black cursor-pointer"
                                  title="Edit Shift"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteShift(s.id, s.staffName, s.day)}
                                  className="p-0.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                                  title="Remove Shift"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            <span className="text-[10px] text-neutral-500 block truncate">{s.role}</span>

                            <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-lg border border-neutral-200">
                              <Clock className="h-2.5 w-2.5 text-neutral-600" />
                              <span className="truncate">{s.shiftTime}</span>
                            </div>

                            {s.notes && (
                              <p className="text-[10px] text-neutral-400 truncate italic mt-0.5">{s.notes}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenAddShift(day)}
                    className="mt-3 w-full rounded-xl border border-dashed border-neutral-300 py-1.5 text-[11px] font-semibold text-neutral-500 hover:text-black hover:border-neutral-400 hover:bg-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Shift</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit Staff Profile */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowAddStaffModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-neutral-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-neutral-900">
                {editingStaff ? 'Edit Staff Profile' : 'Add New Team Member'}
              </h3>
              <p className="text-xs text-neutral-500">Enter personal details, role, department, and payroll rates</p>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Sarah Johnson"
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Staff Code / ID</label>
                  <input
                    type="text"
                    value={staffForm.staffCode}
                    onChange={(e) => setStaffForm({ ...staffForm, staffCode: e.target.value })}
                    placeholder="e.g. PHC_01"
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Role / Title *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
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
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
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
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Monthly Salary (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={staffForm.monthlySalary}
                    onChange={(e) => setStaffForm({ ...staffForm, monthlySalary: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Hourly Rate (₦/hr)</label>
                  <input
                    type="number"
                    min="0"
                    value={staffForm.hourlyRate}
                    onChange={(e) => setStaffForm({ ...staffForm, hourlyRate: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="+234 803 123 4567"
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Status</label>
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value as StaffMember['status'] })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  {editingStaff ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Staff Confirmation */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="h-11 w-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-neutral-900">Remove Staff Member?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Are you sure you want to remove <strong className="text-neutral-900">{deletingStaff.fullName}</strong> ({deletingStaff.role}) from the team directory?
              </p>
              <span className="text-[11px] text-red-600 block mt-2 font-medium">All assigned weekly shifts will also be unassigned.</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteStaff}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Delete Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Assign / Edit Shift */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowShiftModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-neutral-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-neutral-900">
                {editingShift ? 'Edit Shift Assignment' : 'Assign Shift to Staff'}
              </h3>
              <p className="text-xs text-neutral-500">Configure day of week and operating hours</p>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Staff Member *</label>
                <select
                  required
                  value={shiftForm.staffId}
                  onChange={(e) => setShiftForm({ ...shiftForm, staffId: e.target.value })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                >
                  <option value="" disabled>Select Staff Member</option>
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role}) {s.status !== 'active' ? `— [${s.status.toUpperCase()}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Day of the Week</label>
                <select
                  value={shiftForm.day}
                  onChange={(e) => setShiftForm({ ...shiftForm, day: e.target.value as DayOfWeek })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Shift Hours Preset</label>
                <select
                  value={shiftForm.shiftTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftTime: e.target.value })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                >
                  {SHIFT_PRESETS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="Custom">Custom Time...</option>
                </select>
              </div>

              {shiftForm.shiftTime === 'Custom' && (
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Custom Hours (e.g. 10:00 - 18:00)</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.customTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, customTime: e.target.value })}
                    placeholder="e.g. 10:00 - 19:00"
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-semibold focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Shift Notes / Station</label>
                <input
                  type="text"
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  placeholder="e.g. Opening register / Counter A"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  {editingShift ? 'Update Shift' : 'Assign Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
