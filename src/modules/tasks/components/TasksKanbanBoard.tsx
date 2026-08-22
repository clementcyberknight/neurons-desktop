import React from 'react'
import type { TaskRecord } from '@/types/database'
import { TaskCard } from './TaskCard'

export interface KanbanColumn {
  id: TaskRecord['status']
  label: string
  dotColor: string
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', label: 'To Do', dotColor: 'bg-neutral-400' },
  { id: 'in_progress', label: 'In Progress', dotColor: 'bg-blue-500' },
  { id: 'done', label: 'Completed', dotColor: 'bg-emerald-500' },
]

interface TasksKanbanBoardProps {
  tasks: TaskRecord[]
  onMoveStatus: (taskId: string, currentStatus: TaskRecord['status']) => void
  onToggleSubtask: (task: TaskRecord, subIndex: number) => void
  onDeleteTask: (taskId: string) => void
}

export const TasksKanbanBoard: React.FC<TasksKanbanBoardProps> = ({
  tasks,
  onMoveStatus,
  onToggleSubtask,
  onDeleteTask,
}) => {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto min-h-[450px]">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id)
        return (
          <div
            key={col.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 font-mono flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                  {col.label}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-600 border border-neutral-200">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No tasks in this column.
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMoveStatus={onMoveStatus}
                      onToggleSubtask={onToggleSubtask}
                      onDeleteTask={onDeleteTask}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
