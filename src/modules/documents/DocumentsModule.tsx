import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { DocumentRecord } from '@/types/database'
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Check,
  Tag,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  searchQuery: string
  onAskAI: (prompt: string) => void
}

export const DocumentsModule: React.FC<Props> = ({ searchQuery, onAskAI }) => {
  const documents = useLiveQuery(async () => {
    let docs = await db.documents.toArray()
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      docs = docs.filter(
        (d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)
      )
    }
    return docs.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
  }, [searchQuery]) || []

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState<DocumentRecord['category']>('sop')

  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0]

  const handleSelect = (doc: DocumentRecord) => {
    setSelectedDocId(doc.id)
    setIsEditing(false)
  }

  const handleCreateNew = async () => {
    const now = Date.now()
    const newDoc: DocumentRecord = {
      id: `doc-${now}`,
      title: 'Untitled Store Document',
      content: '# New Document\n\nStart writing your standard operating procedure or policy here...',
      category: 'notes',
      tags: ['Draft'],
      author: 'Store Manager',
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      synced: 0,
    }
    await db.documents.add(newDoc)
    setSelectedDocId(newDoc.id)
    setIsEditing(true)
    setEditTitle(newDoc.title)
    setEditContent(newDoc.content)
    setEditCategory(newDoc.category)
  }

  const handleStartEdit = () => {
    if (!activeDoc) return
    setIsEditing(true)
    setEditTitle(activeDoc.title)
    setEditContent(activeDoc.content)
    setEditCategory(activeDoc.category)
  }

  const handleSaveEdit = async () => {
    if (!activeDoc) return
    await db.documents.update(activeDoc.id, {
      title: editTitle,
      content: editContent,
      category: editCategory,
      updatedAt: Date.now(),
      synced: 0,
    })
    setIsEditing(false)
  }

  const handleTogglePin = async (doc: DocumentRecord) => {
    await db.documents.update(doc.id, {
      isPinned: !doc.isPinned,
      updatedAt: Date.now(),
      synced: 0,
    })
  }

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await db.documents.delete(docId)
      if (selectedDocId === docId) {
        setSelectedDocId(null)
      }
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Document Sidebar List */}
      <div className="w-80 shrink-0 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Knowledge Base ({documents.length})
            </span>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-2 py-1 text-xs font-medium transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Doc</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {documents.map((doc) => {
              const isSelected = activeDoc?.id === doc.id
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelect(doc)}
                  className={`group relative flex flex-col rounded-xl p-3 text-left transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/50 shadow-sm text-white'
                      : 'border-slate-800/60 bg-slate-900/40 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                      <FileText className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="truncate">{doc.title}</span>
                    </div>
                    {doc.isPinned && (
                      <Pin className="h-3 w-3 text-amber-400 shrink-0 fill-amber-400" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="uppercase bg-slate-800/80 px-1.5 py-0.5 rounded">{doc.category}</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Drafting Helper */}
        <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Document Generator</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">Generate SOPs or audit policies with custom markdown schema.</p>
          <button
            onClick={() => onAskAI('Prepare a detailed tax filing checklist and cashier float reconciliation policy in markdown format.')}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-1.5 transition-all shadow-sm"
          >
            Draft Policy with AI
          </button>
        </div>
      </div>

      {/* Active Document Viewer / Editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/30">
        {activeDoc ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Document Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-3 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono uppercase text-indigo-400 border border-slate-700">
                  {activeDoc.category}
                </span>
                <span className="text-xs text-slate-400">By {activeDoc.author}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePin(activeDoc)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                  title="Pin document"
                >
                  <Pin className={`h-4 w-4 ${activeDoc.isPinned ? 'text-amber-400 fill-amber-400' : ''}`} />
                </button>

                {isEditing ? (
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(activeDoc.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-2xl font-bold bg-transparent text-white border-b border-slate-700 pb-2 focus:outline-none focus:border-indigo-500"
                    placeholder="Document Title..."
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400">Category:</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
                    >
                      <option value="policy">Policy</option>
                      <option value="sop">SOP</option>
                      <option value="report">Report</option>
                      <option value="memo">Memo</option>
                      <option value="notes">Notes</option>
                    </select>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={18}
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Markdown content..."
                  />
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <h1 className="text-2xl font-bold text-white mb-4">{activeDoc.title}</h1>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeDoc.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <BookOpen className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Select a document or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
