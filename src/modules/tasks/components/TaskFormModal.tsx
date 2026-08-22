import React from 'react'
import { FormModal } from '@/components/ui/FormModal'
import type { TaskRecord } from '@/types/database'
import iconChecklist from '@/assets/icons-pack/Clipboard-Task-Pending-Action--Streamline-Plump.png'

export interface TaskFormData {
  title: string
  assigneeRole: string
  priority: TaskRecord['priority']
  dueDate: string
}

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  formData: TaskFormData
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  onClose,
  formData,
  setFormData,
  onSubmit,
}) => {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="md"
      title="Create Action Item"
      icon={<img src={iconChecklist} alt="Checklist" className="h-5 w-5 object-contain" />}
      submitLabel="Create Task"
    >
      <div>
        <label className="text-neutral-600 block font-semibold mb-1">Task Title *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g. Conduct weekly cashier till discrepancy audit"
          className="w-full rounded-xl bg-neutral-50 border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-neutral-600 block font-semibold mb-1">Assignee Role</label>
          <input
            type="text"
            value={formData.assigneeRole}
            onChange={(e) => setFormData({ ...formData, assigneeRole: e.target.value })}
            className="w-full rounded-xl bg-neutral-50 border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:bg-white"
          />
        </div>

        <div>
          <label className="text-neutral-600 block font-semibold mb-1">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as TaskRecord['priority'] })
            }
            className="w-full rounded-xl bg-neutral-50 border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:outline-none cursor-pointer"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-neutral-600 block font-semibold mb-1">Due Date</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="w-full rounded-xl bg-neutral-50 border border-neutral-300 p-2.5 text-xs text-neutral-900 focus:outline-none cursor-pointer font-mono"
        />
      </div>
    </FormModal>
  )
}
