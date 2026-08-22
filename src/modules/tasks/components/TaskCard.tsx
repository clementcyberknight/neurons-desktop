import React from 'react'
import type { TaskRecord } from '@/types/database'
import { Clock, ArrowRight, Trash2 } from 'lucide-react'

interface TaskCardProps {
  task: TaskRecord
  onMoveStatus: (taskId: string, currentStatus: TaskRecord['status']) => void
  onToggleSubtask: (task: TaskRecord, subIndex: number) => void
  onDeleteTask: (taskId: string) => void
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onMoveStatus,
  onToggleSubtask,
  onDeleteTask,
}) => {
  return (
    <div className="group rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 text-xs shadow-2xs hover:border-neutral-300 transition-all space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-neutral-900 leading-snug">{task.title}</h4>
        <button
          type="button"
          onClick={() => onDeleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition-opacity cursor-pointer"
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Assignee & Priority Badge */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="rounded bg-white border border-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-700 font-mono">
          {task.assigneeRole}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
            task.priority === 'HIGH'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : task.priority === 'MEDIUM'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
          }`}
        >
          {task.priority}
        </span>
      </div>

      {/* Subtasks checklist */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-1 bg-white p-2 rounded-lg border border-neutral-200">
          {task.subtasks.map((st, sIdx) => (
            <label
              key={sIdx}
              className="flex items-center gap-2 text-[11px] text-neutral-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={st.completed}
                onChange={() => onToggleSubtask(task, sIdx)}
                className="rounded border-neutral-300 text-black focus:ring-0 cursor-pointer"
              />
              <span className={st.completed ? 'line-through text-neutral-400' : ''}>
                {st.text}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Meta & Status Advance */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-[10px]">
        <div className="flex items-center gap-1 font-mono text-neutral-500">
          <Clock className="h-3 w-3" />
          <span>{task.dueDate}</span>
        </div>

        <button
          type="button"
          onClick={() => onMoveStatus(task.id, task.status)}
          className="flex items-center gap-1 text-[11px] font-semibold text-neutral-800 hover:text-black transition-colors cursor-pointer"
        >
          <span>{task.status === 'done' ? 'Reopen' : 'Advance'}</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
