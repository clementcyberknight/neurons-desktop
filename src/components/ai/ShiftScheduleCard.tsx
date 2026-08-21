import React from 'react'
import { Calendar, UserCheck, Check, Plus } from 'lucide-react'
import type { ShiftScheduleSchema } from '@/types/schemas'
import type { ShiftEntry } from '@/types/database'
import { db } from '@/db/localDb'

interface Props {
  data: ShiftScheduleSchema
  onApply?: () => void
}

const VALID_DAYS: ShiftEntry['day'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export const ShiftScheduleCard: React.FC<Props> = ({ data, onApply }) => {
  const [applied, setApplied] = React.useState(false)

  const handleApplyToRota = async () => {
    try {
      const now = Date.now()
      const entries: ShiftEntry[] = data.schedule.map((s, idx) => ({
        id: `shf-gen-${now}-${idx}`,
        weekStarting: data.week_starting || '2026-09-01',
        staffId: s.staff_id || `stf-${idx}`,
        staffName: s.name,
        role: s.role,
        day: VALID_DAYS.includes(s.day as ShiftEntry['day']) ? (s.day as ShiftEntry['day']) : 'Monday',
        shiftTime: s.shift,
        isCovered: true,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      }))
      await db.shifts.bulkAdd(entries)
      setApplied(true)
      if (onApply) onApply()
    } catch (e) {
      console.error('Failed to apply shift schedule:', e)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs text-neutral-900 my-2">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-neutral-900">Staff Shift Rota</h4>
            <span className="text-xs text-neutral-500 font-mono">Week Starting: {data.week_starting || 'Next Week'}</span>
          </div>
        </div>
        <button
          onClick={handleApplyToRota}
          disabled={applied}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            applied
              ? 'bg-neutral-100 text-neutral-800'
              : 'bg-black hover:bg-neutral-800 text-white shadow-xs'
          }`}
        >
          {applied ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {applied ? 'Added to Rota' : 'Apply to Staff'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
              <th className="pb-2 font-medium">Day</th>
              <th className="pb-2 font-medium">Staff Member</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Shift Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.schedule.map((s, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="py-2 font-semibold text-neutral-900">{s.day}</td>
                <td className="py-2 text-neutral-800 flex items-center gap-1.5 font-medium">
                  <UserCheck className="h-3 w-3 text-neutral-600" />
                  {s.name}
                </td>
                <td className="py-2 text-neutral-500">{s.role}</td>
                <td className="py-2 font-mono text-neutral-900 font-bold">{s.shift}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
