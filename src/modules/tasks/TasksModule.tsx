import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { TaskRecord } from '@/types/database'
import {
  Plus,
  Clock,
  ArrowRight,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react'
import iconTask from '@/assets/icons-pack/List-To-Do-Tasks-Checklist--Streamline-Plump.png'
import iconChecklist from '@/assets/icons-pack/Clipboard-Task-Pending-Action--Streamline-Plump.png'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const COLUMNS: { id: TaskRecord['status']; label: string; dotColor: string }[] = [
  { id: 'todo', label: 'To Do', dotColor: 'bg-neutral-400' },
  { id: 'in_progress', label: 'In Progress', dotColor: 'bg-blue-500' },
  { id: 'done', label: 'Completed', dotColor: 'bg-emerald-500' },
]

export const TasksModule: React.FC<Props> = ({ searchQuery = '', onAskAI }) => {
  const tasks = useLiveQuery(async () => {
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
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskRole, setNewTaskRole] = useState('Store Manager')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskRecord['priority']>('HIGH')
  const [newTaskDue, setNewTaskDue] = useState('2026-08-25')

  const handleMoveStatus = async (taskId: string, currentStatus: TaskRecord['status']) => {
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
  }

  const handleToggleSubtask = async (task: TaskRecord, subIndex: number) => {
    const updated = [...task.subtasks]
    updated[subIndex] = { ...updated[subIndex], completed: !updated[subIndex].completed }
    await db.tasks.update(task.id, {
      subtasks: updated,
      updatedAt: Date.now(),
      synced: 0,
    })
  }

  const handleDeleteTask = async (taskId: string) => {
    await db.tasks.delete(taskId)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const now = Date.now()
    await db.tasks.add({
      id: `tsk-${now}`,
      title: newTaskTitle,
      status: 'todo',
      priority: newTaskPriority,
      assigneeRole: newTaskRole,
      dueDate: newTaskDue,
      subtasks: [
        { id: `sub-${now}-0`, text: 'Initial review and action step', completed: false },
      ],
      origin: 'manual',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })
    setNewTaskTitle('')
    setShowAddModal(false)
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa]">
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={iconTask} alt="Tasks" className="h-9 w-9 object-contain" />
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">Kanban Task Board</h3>
              <p className="text-xs text-neutral-500">
                {tasks.length} total action items • {tasks.filter((t) => t.status === 'done').length} completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto min-h-[450px]">
        {COLUMNS.map((col) => {
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
                      <div
                        key={task.id}
                        className="group rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 text-xs shadow-2xs hover:border-neutral-300 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-neutral-900 leading-snug">
                            {task.title}
                          </h4>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition-opacity"
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
                                  onChange={() => handleToggleSubtask(task, sIdx)}
                                  className="rounded border-neutral-300 text-black focus:ring-0"
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
                            onClick={() => handleMoveStatus(task.id, task.status)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-800 hover:text-black transition-colors"
                          >
                            <span>{col.id === 'done' ? 'Reopen' : 'Advance'}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <img src={iconChecklist} alt="Checklist" className="h-5 w-5 object-contain" />
                <h3 className="text-sm font-bold text-neutral-900">Create Action Item</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-600">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Conduct weekly cashier till discrepancy audit"
                  className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-600">Assignee Role</label>
                  <input
                    type="text"
                    value={newTaskRole}
                    onChange={(e) => setNewTaskRole(e.target.value)}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-neutral-600">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-600">Due Date</label>
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-1.5 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-4 py-1.5 text-white font-medium shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
