import React from 'react'
import { Calendar, UserCheck, Check, Plus } from 'lucide-react'
import type { ShiftScheduleSchema } from '@/types/schemas'
import { db } from '@/db/localDb'

interface Props {
  data: ShiftScheduleSchema
  onApply?: () => void
}

export const ShiftScheduleCard: React.FC<Props> = ({ data, onApply }) => {
  const [applied, setApplied] = React.useState(false)

  const handleApplyToRota = async () => {
    try {
      const now = Date.now()
      const entries = data.schedule.map((s, idx) => ({
        id: `shf-gen-${now}-${idx}`,
        weekStarting: data.week_starting || '2026-09-01',
        staffId: s.staff_id || `stf-${idx}`,
        staffName: s.name,
        role: s.role,
        day: s.day as any,
        shiftTime: s.shift,
        isCovered: true,
        createdAt: now,
        updatedAt: now,
        synced: 0 as const,
      }))
      await db.shifts.bulkAdd(entries)
      setApplied(true)
      if (onApply) onApply()
    } catch (e) {
      console.error('Failed to apply shift schedule:', e)
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg text-slate-100 my-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight">Staff Shift Rota</h4>
            <span className="text-xs text-slate-400 font-mono">Week Starting: {data.week_starting || 'Next Week'}</span>
          </div>
        </div>
        <button
          onClick={handleApplyToRota}
          disabled={applied}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            applied
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
          }`}
        >
          {applied ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {applied ? 'Added to Rota' : 'Apply to Staff'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-2 font-medium">Day</th>
              <th className="pb-2 font-medium">Staff Member</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Shift Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.schedule.map((s, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30">
                <td className="py-2 font-semibold text-slate-200">{s.day}</td>
                <td className="py-2 text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="h-3 w-3 text-blue-400" />
                  {s.name}
                </td>
                <td className="py-2 text-slate-400">{s.role}</td>
                <td className="py-2 font-mono text-emerald-400">{s.shift}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
