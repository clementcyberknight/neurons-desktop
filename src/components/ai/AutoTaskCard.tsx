import React from 'react'
import { CheckSquare, Clock, Plus, Check } from 'lucide-react'
import type { AutoTaskSchema } from '@/types/schemas'
import { db } from '@/db/localDb'

interface Props {
  data: AutoTaskSchema
  onApply?: () => void
}

export const AutoTaskCard: React.FC<Props> = ({ data, onApply }) => {
  const [applied, setApplied] = React.useState(false)

  const handleCreateTask = async () => {
    try {
      const now = Date.now()
      await db.tasks.add({
        id: `tsk-ai-${now}`,
        title: data.task_title,
        status: 'todo',
        priority: data.priority,
        assigneeRole: data.assignee_role,
        dueDate: data.due_date || '2026-08-25',
        subtasks: (data.subtasks || []).map((t, idx) => ({
          id: `sub-${now}-${idx}`,
          text: t,
          completed: false,
        })),
        origin: 'ai_generated',
        createdAt: now,
        updatedAt: now,
        synced: 0,
      })
      setApplied(true)
      if (onApply) onApply()
    } catch (e) {
      console.error('Failed to create task:', e)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs text-neutral-900 my-2">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
            <CheckSquare className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-neutral-900">{data.task_title}</h4>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="font-medium text-neutral-800">{data.assignee_role}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono"><Clock className="h-3 w-3" /> {data.due_date}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreateTask}
          disabled={applied}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            applied
              ? 'bg-neutral-100 text-neutral-800'
              : 'bg-black hover:bg-neutral-800 text-white shadow-xs'
          }`}
        >
          {applied ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {applied ? 'Added to Kanban' : 'Add to Tasks'}
        </button>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Subtasks</span>
        {data.subtasks?.map((st, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-neutral-800 bg-neutral-50 p-1.5 rounded-md border border-neutral-200">
            <div className="h-3.5 w-3.5 rounded bg-white border border-neutral-300 flex items-center justify-center text-[9px] font-bold text-neutral-600">
              {idx + 1}
            </div>
            <span>{st}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
