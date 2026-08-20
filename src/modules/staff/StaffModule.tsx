import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import {
  Users,
  Calendar,
  Clock,
  UserCheck,
  Phone,
} from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export const StaffModule: React.FC<Props> = ({ searchQuery = '' }) => {
  const staff = useLiveQuery(async () => {
    let list = await db.staff.toArray()
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      )
    }
    return list
  }, [searchQuery]) || []

  const shifts = useLiveQuery(() => db.shifts.toArray()) || []
  const [activeTab, setActiveTab] = useState<'rota' | 'directory'>('rota')

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">Staff Operations & Shift Rota</h3>
          <p className="text-xs text-neutral-500">
            {staff.length} team members • {shifts.length} active shift assignments for week
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex rounded-lg bg-neutral-200/80 p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('rota')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'rota' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Shift Rota</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'directory' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Staff Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'rota' ? (
        /* Visual Weekly Rota Board */
        <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 flex flex-col justify-between overflow-x-auto shadow-2xs">
          <div className="grid grid-cols-7 gap-3 min-w-[750px]">
            {DAYS.map((day) => {
              const dayShifts = shifts.filter((s) => s.day === day)
              return (
                <div key={day} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 flex flex-col">
                  <div className="border-b border-neutral-200 pb-2 mb-2">
                    <h4 className="text-xs font-bold text-neutral-900">{day}</h4>
                    <span className="text-[10px] font-mono text-neutral-500">{dayShifts.length} assigned</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayShifts.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-[10px] text-neutral-400 italic">
                        No shift
                      </div>
                    ) : (
                      dayShifts.map((s) => (
                        <div
                          key={s.id}
                          className="rounded-lg border border-neutral-200 bg-white p-2 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-1 font-semibold text-neutral-900">
                            <UserCheck className="h-3 w-3 text-neutral-700 shrink-0" />
                            <span className="truncate">{s.staffName}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 block truncate">{s.role}</span>
                          <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{s.shiftTime}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Staff Directory Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs hover:border-neutral-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-900 font-bold text-sm">
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900">{member.fullName}</h4>
                    <span className="text-xs text-neutral-500">{member.role}</span>
                  </div>
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-800 border border-neutral-200">
                  {member.department}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-neutral-600 border-t border-neutral-100 pt-3">
                <div className="flex items-center justify-between font-mono">
                  <span>Monthly Payroll:</span>
                  <span className="font-bold text-neutral-900">₦{member.monthlySalary.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span>Hourly Rate:</span>
                  <span className="text-neutral-700">₦{member.hourlyRate.toLocaleString()}/hr</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400">
                  <Phone className="h-3 w-3" /> <span>{member.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
