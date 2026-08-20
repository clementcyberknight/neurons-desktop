import React from 'react'
import { FileText, Check, Plus, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DocumentOutputSchema } from '@/types/schemas'
import { db } from '@/db/localDb'

interface Props {
  data: DocumentOutputSchema
  onApply?: () => void
}

export const DocumentCard: React.FC<Props> = ({ data, onApply }) => {
  const [applied, setApplied] = React.useState(false)

  const handleSaveDocument = async () => {
    try {
      const now = Date.now()
      await db.documents.add({
        id: `doc-ai-${now}`,
        title: data.doc_title,
        content: data.content,
        category: 'report',
        tags: ['AI-Generated', 'Report'],
        author: 'BAU Copilot',
        isPinned: false,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      })
      setApplied(true)
      if (onApply) onApply()
    } catch (e) {
      console.error('Failed to save document:', e)
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg text-slate-100 my-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight">{data.doc_title}</h4>
            <span className="text-xs text-slate-400 font-mono">Format: {data.format}</span>
          </div>
        </div>
        <button
          onClick={handleSaveDocument}
          disabled={applied}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            applied
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
          }`}
        >
          {applied ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {applied ? 'Saved to Docs' : 'Save to Documents'}
        </button>
      </div>

      <div className="rounded-lg bg-slate-950/60 p-3 text-xs text-slate-300 leading-relaxed border border-slate-800/80 max-h-64 overflow-y-auto prose prose-invert prose-xs">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {data.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
