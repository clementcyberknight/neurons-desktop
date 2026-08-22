import React, { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { TaskRecord } from '@/types/database'
import { TasksHeader } from './components/TasksHeader'
import { TasksKanbanBoard } from './components/TasksKanbanBoard'
import { TaskFormModal, type TaskFormData } from './components/TaskFormModal'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const INITIAL_TASK_FORM: TaskFormData = {
  title: '',
  assigneeRole: 'Store Manager',
  priority: 'HIGH',
  dueDate: '2026-08-25',
}

export const TasksModule: React.FC<Props> = ({ searchQuery = '' }) => {
  const tasks =
    useLiveQuery(async () => {
      let list = await db.tasks.toArray()
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        list = list.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.assigneeRole.toLowerCase().includes(q)
        )
      }
      return list
    }, [searchQuery]) || []

  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState<TaskFormData>(INITIAL_TASK_FORM)

  const handleMoveStatus = useCallback(
    async (taskId: string, currentStatus: TaskRecord['status']) => {
      const nextStatus: TaskRecord['status'] =
        currentStatus === 'todo'
          ? 'in_progress'
          : currentStatus === 'in_progress'
          ? 'done'
          : 'todo'

      await db.tasks.update(taskId, {
        status: nextStatus,
        updatedAt: Date.now(),
        synced: 0,
      })
    },
    []
  )

  const handleToggleSubtask = useCallback(async (task: TaskRecord, subIndex: number) => {
    const updated = [...task.subtasks]
    updated[subIndex] = { ...updated[subIndex], completed: !updated[subIndex].completed }
    await db.tasks.update(task.id, {
      subtasks: updated,
      updatedAt: Date.now(),
      synced: 0,
    })
  }, [])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await db.tasks.delete(taskId)
  }, [])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const now = Date.now()
    await db.tasks.add({
      id: `tsk-${now}`,
      title: formData.title.trim(),
      status: 'todo',
      priority: formData.priority,
      assigneeRole: formData.assigneeRole,
      dueDate: formData.dueDate,
      subtasks: [
        { id: `sub-${now}-0`, text: 'Initial review and action step', completed: false },
      ],
      origin: 'manual',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })
    setFormData(INITIAL_TASK_FORM)
    setShowAddModal(false)
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] select-none no-scrollbar">
      {/* Top Header */}
      <TasksHeader
        totalTasks={tasks.length}
        completedTasks={tasks.filter((t) => t.status === 'done').length}
        onOpenCreate={() => {
          setFormData(INITIAL_TASK_FORM)
          setShowAddModal(true)
        }}
      />

      {/* 3-Column Kanban Board */}
      <TasksKanbanBoard
        tasks={tasks}
        onMoveStatus={handleMoveStatus}
        onToggleSubtask={handleToggleSubtask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Add Task Modal */}
      <TaskFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateTask}
      />
    </div>
  )
}
export default TasksModule
