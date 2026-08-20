import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { DocumentRecord } from '@/types/database'
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Printer,
  Search,
  Grid,
  List,
  Clock,
  ClipboardList,
  BarChart2,
  ShieldCheck,
  UserCheck,
  ListChecks,
  File,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { DOCUMENT_TEMPLATES, type DocumentTemplate } from './templates'
import { DocumentEditor } from './DocumentEditor'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const TEMPLATE_ICONS: Record<string, any> = {
  File,
  ClipboardList,
  BarChart2,
  ShieldCheck,
  UserCheck,
  ListChecks,
}

export const DocumentsModule: React.FC<Props> = ({ searchQuery: externalSearchQuery = '' }) => {
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pinned' | 'policy' | 'sop' | 'report' | 'memo' | 'notes'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, externalSearchQuery, selectedFilter, pageSize])

  // Paginated and Filtered Query
  const { documents, totalCount, totalPages } = useLiveQuery(async () => {
    let all = await db.documents.toArray()
    const query = (searchQuery || externalSearchQuery).trim().toLowerCase()

    if (query) {
      all = all.filter(
        (d) => d.title.toLowerCase().includes(query) || (d.content || '').toLowerCase().includes(query)
      )
    }

    if (selectedFilter === 'pinned') {
      all = all.filter((d) => d.isPinned)
    } else if (selectedFilter !== 'all') {
      all = all.filter((d) => d.category === selectedFilter)
    }

    // Sort pinned first, then newest updated
    all.sort((a, b) => {
      if (b.isPinned !== a.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
      return b.updatedAt - a.updatedAt
    })

    const count = all.length
    const pages = Math.max(1, Math.ceil(count / pageSize))
    const validPage = Math.min(currentPage, pages)
    const startIndex = (validPage - 1) * pageSize
    const paginatedSlice = all.slice(startIndex, startIndex + pageSize)

    return {
      documents: paginatedSlice,
      totalCount: count,
      totalPages: pages,
    }
  }, [searchQuery, externalSearchQuery, selectedFilter, currentPage, pageSize]) || {
    documents: [],
    totalCount: 0,
    totalPages: 1,
  }

  // Active single document for editor
  const activeDoc = useLiveQuery(
    () => (activeDocId ? db.documents.get(activeDocId) : Promise.resolve(undefined)),
    [activeDocId]
  )

  // Create document from template or blank
  const handleCreateFromTemplate = async (tmpl: DocumentTemplate) => {
    const now = Date.now()
    const newDoc: DocumentRecord = {
      id: `doc-${now}`,
      title: tmpl.id === 'blank' ? 'Untitled Document' : `${tmpl.title} (${new Date().toLocaleDateString()})`,
      content: tmpl.htmlContent,
      category: tmpl.category,
      tags: [tmpl.category.toUpperCase()],
      author: 'Akhimien Clement',
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      synced: 0,
    }
    await db.documents.add(newDoc)
    setActiveDocId(newDoc.id)
  }

  const handleTogglePin = async (e: React.MouseEvent, doc: DocumentRecord) => {
    e.stopPropagation()
    await db.documents.update(doc.id, {
      isPinned: !doc.isPinned,
      updatedAt: Date.now(),
      synced: 0,
    })
  }

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this document?')) {
      await db.documents.delete(docId)
      if (activeDocId === docId) {
        setActiveDocId(null)
      }
    }
  }

  const handlePrintQuick = (e: React.MouseEvent, doc: DocumentRecord) => {
    e.stopPropagation()
    setActiveDocId(doc.id)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  // Strip HTML tags for clean text snippets
  const getSnippet = (htmlOrMd: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = htmlOrMd
    return tmp.innerText.slice(0, 140) || 'No additional content...'
  }

  // If a document is actively opened, show full Word/Google Docs editor
  if (activeDoc) {
    return (
      <DocumentEditor
        document={activeDoc}
        onBack={() => setActiveDocId(null)}
        onDelete={(id) => {
          db.documents.delete(id)
          setActiveDocId(null)
        }}
      />
    )
  }

  const startRecordIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRecordIndex = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex flex-col h-full bg-[#f9fafb] select-none font-sans overflow-y-auto no-scrollbar">
      <div className="max-w-6xl mx-auto w-full px-6 sm:px-10 py-6 space-y-8">
        {/* Template Gallery (Start a New Document) */}
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
              Start a new document from template
            </span>

            {/* Horizontally Aligned Blank Document Button */}
            <button
              onClick={() => handleCreateFromTemplate(DOCUMENT_TEMPLATES[0])}
              className="flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Blank Document</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {DOCUMENT_TEMPLATES.map((tmpl) => {
              const IconComponent = TEMPLATE_ICONS[tmpl.iconName] || FileText
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleCreateFromTemplate(tmpl)}
                  className="group flex flex-col text-left rounded-2xl border border-neutral-200 bg-white p-3.5 hover:border-neutral-400 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div
                    className="h-28 w-full rounded-xl border border-neutral-100 flex flex-col items-center justify-center gap-2 p-3 transition-colors mb-2.5"
                    style={{ backgroundColor: `${tmpl.color}0a` }}
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: tmpl.color, color: '#ffffff' }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold">{tmpl.category}</span>
                  </div>

                  <h3 className="text-xs font-bold text-neutral-900 group-hover:text-black line-clamp-1">
                    {tmpl.title}
                  </h3>
                  <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5 leading-tight">
                    {tmpl.description}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Previously Edited Documents & Files */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono mr-2">
                Recent Documents ({totalCount})
              </span>

              {/* Filter Tabs */}
              {(['all', 'pinned', 'policy', 'sop', 'report', 'memo', 'notes'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all uppercase font-mono cursor-pointer shrink-0 ${
                    selectedFilter === filter
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-black'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search + View Mode Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search docs..."
                  className="pl-8 pr-3 py-1 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-black w-40 sm:w-48"
                />
              </div>

              <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-neutral-100 text-black' : 'text-neutral-400 hover:text-black'}`}
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded cursor-pointer ${viewMode === 'list' ? 'bg-neutral-100 text-black' : 'text-neutral-400 hover:text-black'}`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Documents Grid / Table View */}
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-400">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-700">No documents found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'Try clearing your search filters or start a new document.' : 'Create a new blank document or choose a template above.'}
              </p>
              <button
                onClick={() => handleCreateFromTemplate(DOCUMENT_TEMPLATES[0])}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Document</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {documents.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setActiveDocId(d.id)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 hover:border-neutral-400 hover:shadow-md transition-all cursor-pointer h-56"
                >
                  {/* Top card info */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase font-mono text-neutral-700 border border-neutral-200">
                        {d.category}
                      </span>
                      <button
                        onClick={(e) => handleTogglePin(e, d)}
                        className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors"
                        title={d.isPinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className={`h-3.5 w-3.5 ${d.isPinned ? 'fill-neutral-900 text-neutral-900' : ''}`} />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 group-hover:text-black line-clamp-2 leading-snug">
                      {d.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-3 mt-2 leading-relaxed">
                      {getSnippet(d.content)}
                    </p>
                  </div>

                  {/* Bottom Footer metadata & quick actions */}
                  <div className="border-t border-neutral-100 pt-2.5 flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handlePrintQuick(e, d)}
                        className="p-1 rounded hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors"
                        title="Print"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, d.id)}
                        className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500 font-mono">
                    <th className="py-3 px-4 font-semibold">Document Title</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Author</th>
                    <th className="py-3 px-4 font-semibold">Last Modified</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {documents.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setActiveDocId(d.id)}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-semibold text-neutral-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-neutral-500 shrink-0" />
                        <span className="truncate max-w-sm">{d.title}</span>
                        {d.isPinned && <Pin className="h-3 w-3 fill-neutral-900 text-neutral-900 shrink-0" />}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase font-mono text-neutral-700 border border-neutral-200">
                          {d.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{d.author}</td>
                      <td className="py-3 px-4 text-neutral-500 font-mono">{new Date(d.updatedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleTogglePin(e, d)}
                            className="p-1 rounded hover:bg-neutral-200 text-neutral-500"
                            title={d.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin className={`h-3.5 w-3.5 ${d.isPinned ? 'fill-neutral-900' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => handlePrintQuick(e, d)}
                            className="p-1 rounded hover:bg-neutral-200 text-neutral-600"
                            title="Print"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, d.id)}
                            className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-neutral-500 font-mono border-t border-neutral-200">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-neutral-900">{startRecordIndex}</strong> to{' '}
                  <strong className="text-neutral-900">{endRecordIndex}</strong> of{' '}
                  <strong className="text-neutral-900">{totalCount}</strong> documents
                </span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <label>Per page:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-700 focus:outline-none cursor-pointer"
                  >
                    <option value={8}>8</option>
                    <option value={16}>16</option>
                    <option value={24}>24</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-7 w-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
