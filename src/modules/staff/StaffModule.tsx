import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { StaffMember, ShiftEntry } from '@/types/database'
import {
  Users,
  Calendar,
  Plus,
  Clock,
  Sparkles,
  UserCheck,
  Briefcase,
  Phone,
  Mail,
} from 'lucide-react'

interface Props {
  searchQuery: string
  onAskAI: (prompt: string) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export const StaffModule: React.FC<Props> = ({ searchQuery, onAskAI }) => {
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
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Staff Operations & Shift Rota</h3>
          <p className="text-xs text-slate-400">
            {staff.length} team members • {shifts.length} active shift assignments for week
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('rota')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'rota' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Shift Rota</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                activeTab === 'directory' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Staff Directory</span>
            </button>
          </div>

          <button
            onClick={() =>
              onAskAI(
                'Create a shift schedule for next week starting 2026-09-01 for 3 pharmacists: Dr. Sarah, Mr. David, and Ms. Clara.'
              )
            }
            className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Generate Rota</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'rota' ? (
        /* Visual Weekly Rota Board */
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[750px]">
            {DAYS.map((day) => {
              const dayShifts = shifts.filter((s) => s.day === day)
              return (
                <div key={day} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col">
                  <div className="border-b border-slate-800 pb-2 mb-2">
                    <h4 className="text-xs font-bold text-slate-200">{day}</h4>
                    <span className="text-[10px] font-mono text-slate-500">{dayShifts.length} assigned</span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayShifts.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-[10px] text-slate-600 italic">
                        No shift
                      </div>
                    ) : (
                      dayShifts.map((s) => (
                        <div
                          key={s.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-xs hover:border-blue-500/40 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-1 font-semibold text-slate-200">
                            <UserCheck className="h-3 w-3 text-blue-400 shrink-0" />
                            <span className="truncate">{s.staffName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">{s.role}</span>
                          <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
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
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm">
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{member.fullName}</h4>
                    <span className="text-xs text-slate-400">{member.role}</span>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/20">
                  {member.department}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between font-mono">
                  <span>Monthly Payroll:</span>
                  <span className="font-bold text-white">₦{member.monthlySalary.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span>Hourly Rate:</span>
                  <span className="text-slate-300">₦{member.hourlyRate.toLocaleString()}/hr</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
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
