import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { TaskRecord } from '@/types/database'
import {
  CheckSquare,
  Plus,
  Clock,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from 'lucide-react'

interface Props {
  searchQuery: string
  onAskAI: (prompt: string) => void
}

const COLUMNS: { id: TaskRecord['status']; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-slate-700' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-500/40' },
  { id: 'done', label: 'Completed', color: 'border-emerald-500/40' },
]

export const TasksModule: React.FC<Props> = ({ searchQuery, onAskAI }) => {
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
        { id: `sub-${now}-0`, text: 'Initial review and validation', completed: false }
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
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Kanban Task Management</h3>
          <p className="text-xs text-slate-400">
            {tasks.length} total tasks • {tasks.filter((t) => t.status === 'done').length} completed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onAskAI(
                'Create an automated follow-up task for Store Manager to review Cashier #104 refund overrides by 2026-08-25.'
              )
            }
            className="flex items-center gap-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Generate Task</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto min-h-[450px]">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          return (
            <div
              key={col.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        col.id === 'done'
                          ? 'bg-emerald-400'
                          : col.id === 'in_progress'
                          ? 'bg-blue-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    {col.label}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-xs shadow-sm hover:border-slate-700 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-200 group-hover:text-white leading-snug">
                          {task.title}
                        </h4>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Subtasks */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                          {task.subtasks.map((st, sIdx) => (
                            <label
                              key={sIdx}
                              className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => handleToggleSubtask(task, sIdx)}
                                className="rounded border-slate-700 text-purple-600 focus:ring-0"
                              />
                              <span className={st.completed ? 'line-through text-slate-500' : ''}>
                                {st.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Meta Tags & Action */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <div className="flex items-center gap-1.5 font-mono text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{task.dueDate}</span>
                        </div>

                        <button
                          onClick={() => handleMoveStatus(task.id, task.status)}
                          className="flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <span>{col.id === 'done' ? 'Reopen' : 'Advance'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">Create Action Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Conduct weekly cashier till discrepancy check"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Assignee Role</label>
                  <input
                    type="text"
                    value={newTaskRole}
                    onChange={(e) => setNewTaskRole(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-1.5 text-white font-medium shadow-sm"
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
