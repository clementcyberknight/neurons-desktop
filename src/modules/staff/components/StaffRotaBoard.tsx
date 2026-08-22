import React from 'react'
import type { ShiftEntry } from '@/types/database'
import { Plus, UserCheck, Pencil, Trash2, Clock } from 'lucide-react'

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const
export type DayOfWeek = typeof DAYS[number]

interface StaffRotaBoardProps {
  shifts: ShiftEntry[]
  onOpenAddShift: (day: DayOfWeek) => void
  onOpenEditShift: (shift: ShiftEntry) => void
  onDeleteShift: (shiftId: string, staffName: string, day: string) => void
}

export const StaffRotaBoard: React.FC<StaffRotaBoardProps> = ({
  shifts,
  onOpenAddShift,
  onOpenEditShift,
  onDeleteShift,
}) => {
  return (
    <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col justify-between overflow-x-auto shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-900">Weekly Shift Assignment Rota</h3>
        <span className="text-xs text-neutral-500 font-mono">
          {shifts.length} total shifts scheduled
        </span>
      </div>

      <div className="grid grid-cols-7 gap-3 min-w-[900px] flex-1">
        {DAYS.map((day) => {
          const dayShifts = shifts.filter((s) => s.day === day)
          return (
            <div
              key={day}
              className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3 flex flex-col justify-between"
            >
              <div>
                {/* Day Column Header */}
                <div className="border-b border-neutral-200 pb-2 mb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{day}</h4>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {dayShifts.length} assigned
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenAddShift(day)}
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
                        className="group rounded-xl border border-neutral-200 bg-white p-2.5 text-xs shadow-2xs space-y-1 relative hover:border-neutral-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 font-bold text-neutral-900 truncate">
                            <UserCheck className="h-3 w-3 text-neutral-700 shrink-0" />
                            <span className="truncate">{s.staffName}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => onOpenEditShift(s)}
                              className="p-0.5 text-neutral-400 hover:text-black cursor-pointer"
                              title="Edit Shift"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteShift(s.id, s.staffName, s.day)}
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
                          <p className="text-[10px] text-neutral-400 truncate italic mt-0.5">
                            {s.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenAddShift(day)}
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
  )
}
