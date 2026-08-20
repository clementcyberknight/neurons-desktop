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
  BookOpen,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

export const DocumentsModule: React.FC<Props> = ({ searchQuery = '' }) => {
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
      author: 'Akhimien Clement',
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
    <div className="flex h-full overflow-hidden bg-white">
      {/* Document Sidebar List */}
      <div className="w-80 shrink-0 border-r border-neutral-200 bg-[#fafafa] p-4 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Knowledge Base ({documents.length})
            </span>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1 rounded-lg bg-black hover:bg-neutral-800 text-white px-2.5 py-1 text-xs font-medium transition-all shadow-xs"
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
                      ? 'bg-white border-neutral-400 shadow-xs text-black'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-xs truncate">
                      <FileText className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-black' : 'text-neutral-500'}`} />
                      <span className="truncate">{doc.title}</span>
                    </div>
                    {doc.isPinned && (
                      <Pin className="h-3 w-3 text-neutral-900 shrink-0 fill-neutral-900" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span className="uppercase bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">{doc.category}</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Active Document Viewer / Editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {activeDoc ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Document Action Bar */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-2.5 bg-white">
              <div className="flex items-center gap-2">
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono uppercase text-neutral-800 border border-neutral-200">
                  {activeDoc.category}
                </span>
                <span className="text-xs text-neutral-500">By {activeDoc.author}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePin(activeDoc)}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                  title="Pin document"
                >
                  <Pin className={`h-4 w-4 ${activeDoc.isPinned ? 'text-black fill-black' : ''}`} />
                </button>

                {isEditing ? (
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 rounded-lg bg-black hover:bg-neutral-800 text-white px-3 py-1.5 text-xs font-medium transition-all shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 px-3 py-1.5 text-xs font-medium transition-all shadow-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(activeDoc.id)}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                    className="w-full text-2xl font-bold bg-transparent text-neutral-900 border-b border-neutral-300 pb-2 focus:outline-none focus:border-black"
                    placeholder="Document Title..."
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-neutral-500">Category:</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="bg-neutral-50 border border-neutral-300 text-neutral-800 rounded px-2 py-1 text-xs focus:outline-none"
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
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-300 p-4 text-sm font-mono text-neutral-900 focus:outline-none focus:border-black"
                    placeholder="Markdown content..."
                  />
                </div>
              ) : (
                <div className="prose max-w-none text-neutral-900">
                  <h1 className="text-2xl font-bold text-neutral-900 mb-4">{activeDoc.title}</h1>
                  <div className="text-neutral-800 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeDoc.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
            <BookOpen className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Select a document or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
