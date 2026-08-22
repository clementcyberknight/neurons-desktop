import React from 'react'
import { Plus } from 'lucide-react'
import iconTask from '@/assets/icons-pack/List-To-Do-Tasks-Checklist--Streamline-Plump.png'

interface TasksHeaderProps {
  totalTasks: number
  completedTasks: number
  onOpenCreate: () => void
}

export const TasksHeader: React.FC<TasksHeaderProps> = ({
  totalTasks,
  completedTasks,
  onOpenCreate,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-3">
        <img src={iconTask} alt="Tasks" className="h-9 w-9 object-contain" />
        <div>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">Kanban Task Board</h3>
          <p className="text-xs text-neutral-500">
            {totalTasks} total action items • {completedTasks} completed
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  )
}
