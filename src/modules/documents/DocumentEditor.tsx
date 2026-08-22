import React, { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft,
  Printer,
  Download,
  Pin,
  Trash2,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table as TableIcon,
  Highlighter,
  Palette,
  Minus,
  FileSignature,
  FilePlus2,
  CheckCircle2,
  Info,
} from 'lucide-react'
import type { DocumentRecord } from '@/types/database'
import { db } from '@/db/localDb'
import { useAuth } from '@/context/AuthContext'
import { DocumentAISidePanel } from './components/DocumentAISidePanel'
import aiSparklesIcon from '@/assets/icons-pack/Ai-Sparkles--Streamline-Plump.png'

interface Props {
  document: DocumentRecord
  onBack: () => void
  onDelete: (id: string) => void
}

const FONT_FAMILIES = [
  { name: 'Inter (Sans-serif)', value: 'Inter, sans-serif' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
  { name: 'Courier New (Mono)', value: '"Courier New", monospace' },
]

const FONT_SIZES = [
  { label: '10pt', value: '13px' },
  { label: '11pt', value: '15px' },
  { label: '12pt', value: '16px' },
  { label: '14pt', value: '18px' },
  { label: '16pt', value: '21px' },
  { label: '18pt', value: '24px' },
  { label: '24pt', value: '32px' },
  { label: '32pt', value: '42px' },
]

const TEXT_COLORS = [
  { name: 'Default Black', value: '#111827' },
  { name: 'Dark Gray', value: '#4b5563' },
  { name: 'Muted Gray', value: '#9ca3af' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald Green', value: '#059669' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Purple', value: '#7c3aed' },
]

const HIGHLIGHT_COLORS = [
  { name: 'No Highlight', value: 'transparent' },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Cyan', value: '#a5f3fc' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Lavender', value: '#e9d5ff' },
]

export const DocumentEditor: React.FC<Props> = ({ document: initialDoc, onBack, onDelete }) => {
  const { user } = useAuth()
  const [doc, setDoc] = useState<DocumentRecord>(initialDoc)
  const [title, setTitle] = useState(initialDoc.title)
  const [category, setCategory] = useState(initialDoc.category)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)

  // Color Pickers
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showTableMenu, setShowTableMenu] = useState(false)
  const [showCalloutMenu, setShowCalloutMenu] = useState(false)

  // Formatting state
  const [currentFont, setCurrentFont] = useState('Inter, sans-serif')
  const [currentSize, setCurrentSize] = useState('15px')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrike, setIsStrike] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<any>(null)

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      // Check if content is HTML or raw Markdown
      if (initialDoc.content.includes('<') && initialDoc.content.includes('>')) {
        editorRef.current.innerHTML = initialDoc.content
      } else {
        // Convert simple markdown headings/paragraphs to HTML
        const html = initialDoc.content
          .split('\n\n')
          .map((block) => {
            if (block.startsWith('# ')) return `<h1 style="font-size: 26px; font-weight: 800; color: #111827; margin-bottom: 12px;">${block.replace('# ', '')}</h1>`
            if (block.startsWith('## ')) return `<h2 style="font-size: 20px; font-weight: 700; color: #1f2937; margin-top: 18px; margin-bottom: 8px;">${block.replace('## ', '')}</h2>`
            if (block.startsWith('- ')) {
              const items = block.split('\n').map((l) => `<li>${l.replace('- ', '')}</li>`).join('')
              return `<ul style="padding-left: 20px; margin-bottom: 12px; color: #374151;">${items}</ul>`
            }
            return `<p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 12px;">${block}</p>`
          })
          .join('')
        editorRef.current.innerHTML = html
      }
      updateCounts()
    }
  }, [initialDoc.id])

  const updateCounts = () => {
    if (!editorRef.current) return
    const text = editorRef.current.innerText || ''
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(words)
    setCharCount(text.length)
  }

  const triggerAutoSave = (newContent?: string, newTitle?: string, newCategory?: DocumentRecord['category']) => {
    setSaveStatus('saving')
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(async () => {
      const htmlContent = newContent !== undefined ? newContent : (editorRef.current?.innerHTML || '')
      const docTitle = newTitle !== undefined ? newTitle : title
      const docCategory = newCategory !== undefined ? newCategory : category

      await db.documents.update(doc.id, {
        title: docTitle,
        content: htmlContent,
        category: docCategory,
        updatedAt: Date.now(),
        synced: 0,
      })

      setSaveStatus('saved')
    }, 600)
  }

  const handleEditorInput = () => {
    updateCounts()
    triggerAutoSave()
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    triggerAutoSave(undefined, newTitle, undefined)
  }

  const handleCategoryChange = (newCat: DocumentRecord['category']) => {
    setCategory(newCat)
    triggerAutoSave(undefined, undefined, newCat)
  }

  const handleTogglePin = async () => {
    const updatedPin = !doc.isPinned
    setDoc((prev) => ({ ...prev, isPinned: updatedPin }))
    await db.documents.update(doc.id, {
      isPinned: updatedPin,
      updatedAt: Date.now(),
      synced: 0,
    })
  }

  // Selection Preservation Helpers
  const savedRangeRef = useRef<Range | null>(null)

  const saveCurrentSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedRangeRef.current)
      }
    }
  }

  // Exec Command Formatting Helpers
  const execCmd = (cmd: string, val: string = '') => {
    restoreSelection()
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    saveCurrentSelection()
    updateCounts()
    triggerAutoSave()
  }

  const handleStyleChange = (tag: string) => {
    restoreSelection()
    editorRef.current?.focus()
    document.execCommand('formatBlock', false, tag)
    saveCurrentSelection()
    triggerAutoSave()
  }

  const handleFontChange = (font: string) => {
    setCurrentFont(font)
    restoreSelection()
    editorRef.current?.focus()
    document.execCommand('fontName', false, font)
    saveCurrentSelection()
    triggerAutoSave()
  }

  const handleFontSizeChange = (size: string) => {
    setCurrentSize(size)
    restoreSelection()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.style.fontSize = size
    span.appendChild(range.extractContents())
    range.insertNode(span)
    saveCurrentSelection()
    triggerAutoSave()
  }

  const handleTextColor = (color: string) => {
    setShowColorPicker(false)
    restoreSelection()
    editorRef.current?.focus()
    document.execCommand('foreColor', false, color)
    saveCurrentSelection()
    triggerAutoSave()
  }

  const handleHighlight = (color: string) => {
    setShowHighlightPicker(false)
    restoreSelection()
    editorRef.current?.focus()
    const applied = document.execCommand('hiliteColor', false, color)
    if (!applied) {
      document.execCommand('backColor', false, color)
    }
    saveCurrentSelection()
    triggerAutoSave()
  }

  const insertTable = (rows: number, cols: number) => {
    setShowTableMenu(false)
    editorRef.current?.focus()

    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`
    tableHtml += `<thead><tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">`
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th style="border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-weight: 600; color: #374151;">Header ${c + 1}</th>`
    }
    tableHtml += `</tr></thead><tbody>`
    for (let r = 0; r < rows; r++) {
      tableHtml += `<tr style="border-bottom: 1px solid #e5e7eb;">`
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td style="border: 1px solid #e5e7eb; padding: 10px 12px; color: #111827;">Sample cell</td>`
      }
      tableHtml += `</tr>`
    }
    tableHtml += `</tbody></table><p style="font-size: 15px; color: #4b5563; line-height: 1.6;"><br></p>`

    document.execCommand('insertHTML', false, tableHtml)
    triggerAutoSave()
  }

  const insertCallout = (type: 'info' | 'warning' | 'success') => {
    setShowCalloutMenu(false)
    editorRef.current?.focus()

    const config = {
      info: { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af', title: 'NOTE / MEMO' },
      warning: { bg: '#fef3c7', border: '#f59e0b', color: '#92400e', title: 'IMPORTANT PROTOCOL' },
      success: { bg: '#ecfdf5', border: '#10b981', color: '#065f46', title: 'VERIFIED & APPROVED' },
    }[type]

    const calloutHtml = `
      <div style="background-color: ${config.bg}; border-left: 4px solid ${config.border}; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <strong style="color: ${config.color}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${config.title}</strong>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #374151; line-height: 1.5;">Type your important memo or note content here...</p>
      </div>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;"><br></p>
    `
    document.execCommand('insertHTML', false, calloutHtml)
    triggerAutoSave()
  }

  const insertSignatureBlock = () => {
    editorRef.current?.focus()
    const authorName = user?.fullName || doc.author || 'Authorized Staff'
    const roleTitle = user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` : 'Store Manager'
    const company = user?.companyName || 'Business Organization'

    const signHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 36px; font-size: 13px;">
        <tbody>
          <tr>
            <td style="width: 50%; padding-right: 24px;">
              <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 12px;">Prepared By:</p>
              <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 6px;"></div>
              <p style="margin: 0; font-weight: 600; color: #111827;">${authorName} (${roleTitle})</p>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">For: ${company} • Date: ${new Date().toLocaleDateString()}</p>
            </td>
            <td style="width: 50%; padding-left: 24px;">
              <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 12px;">Witnessed / Authorized By:</p>
              <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 6px;"></div>
              <p style="margin: 0; font-weight: 600; color: #111827;">Executive Auditor Signature & Stamp</p>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">Date: ____________________</p>
            </td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;"><br></p>
    `
    document.execCommand('insertHTML', false, signHtml)
    triggerAutoSave()
  }

  const insertPageBreak = () => {
    editorRef.current?.focus()
    const pageBreakHtml = `
      <div style="page-break-after: always; margin: 32px 0; border-bottom: 2px dashed #d1d5db; position: relative; text-align: center;">
        <span style="background: #ffffff; padding: 0 12px; color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; position: relative; top: 8px;">Page Break</span>
      </div>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.6;"><br></p>
    `
    document.execCommand('insertHTML', false, pageBreakHtml)
    triggerAutoSave()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportHtml = () => {
    const content = editorRef.current?.innerHTML || ''
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 40px auto; max-width: 800px; color: #111827; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background-color: #f3f4f6; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
  }

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] font-sans overflow-hidden">
      {/* 1. Top Document App Bar */}
      <div className="h-14 bg-white border-b border-neutral-200 px-4 flex items-center justify-between shrink-0 select-none">
        {/* Left: Back + Document Title Inline */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors shrink-0 cursor-pointer"
            title="Back to All Documents"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-semibold hidden sm:inline">Docs Hub</span>
          </button>

          <div className="h-5 w-px bg-neutral-200 shrink-0" />

          {/* Editable Document Title */}
          <div className="flex flex-col min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-sm font-bold text-neutral-900 bg-transparent border border-transparent hover:border-neutral-300 focus:border-blue-500 rounded px-1.5 py-0.5 focus:bg-white focus:outline-none transition-all truncate max-w-md"
              placeholder="Untitled Document"
            />
            <div className="flex items-center gap-2 px-1.5 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                {saveStatus === 'saving' ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span className="text-neutral-500">Saved to Offline DB</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Category + Pin + Print + Export + Delete */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Category Tag Selector */}
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as DocumentRecord['category'])}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 focus:outline-none uppercase font-mono shadow-2xs cursor-pointer"
          >
            <option value="policy">Policy</option>
            <option value="sop">SOP</option>
            <option value="report">Report</option>
            <option value="memo">Memo</option>
            <option value="notes">Notes</option>
          </select>

          {/* Ask AI Assistant Toggle */}
          <button
            onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              isAIPanelOpen
                ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20 shadow-xs'
                : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
            title="Toggle Neurons AI Copilot"
          >
            <img
              src={aiSparklesIcon}
              alt="AI"
              className={`h-3.5 w-3.5 object-contain ${isAIPanelOpen ? 'brightness-0 invert' : ''}`}
            />
            <span>Ask AI</span>
          </button>

          {/* Pin Document */}
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              doc.isPinned
                ? 'border-neutral-300 bg-neutral-100 text-neutral-900'
                : 'border-neutral-200 bg-white text-neutral-500 hover:text-black hover:bg-neutral-50'
            }`}
            title={doc.isPinned ? 'Unpin Document' : 'Pin Document'}
          >
            <Pin className={`h-3.5 w-3.5 ${doc.isPinned ? 'fill-neutral-900' : ''}`} />
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 px-2.5 py-1 text-xs font-medium transition-all shadow-2xs cursor-pointer"
            title="Print Document (Ctrl+P)"
          >
            <Printer className="h-3.5 w-3.5 text-neutral-600" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* Export HTML */}
          <button
            onClick={handleExportHtml}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 px-2.5 py-1 text-xs font-medium transition-all shadow-2xs cursor-pointer"
            title="Download HTML File"
          >
            <Download className="h-3.5 w-3.5 text-neutral-600" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Delete Document */}
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete Document"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Google Docs / Word Formatting Ribbon */}
      <div className="bg-white border-b border-neutral-200 px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
        {/* Undo / Redo */}
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('undo')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('redo')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 mx-1" />

        {/* Paragraph Styles */}
        <select
          onFocus={saveCurrentSelection}
          onChange={(e) => handleStyleChange(e.target.value)}
          defaultValue="p"
          className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer"
          title="Text Style"
        >
          <option value="p">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote block</option>
        </select>

        {/* Font Family */}
        <select
          onFocus={saveCurrentSelection}
          value={currentFont}
          onChange={(e) => handleFontChange(e.target.value)}
          className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer max-w-[130px]"
          title="Font Family"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.name}</option>
          ))}
        </select>

        {/* Font Size */}
        <select
          onFocus={saveCurrentSelection}
          value={currentSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer w-16"
          title="Font Size"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="h-4 w-px bg-neutral-200 mx-1" />

        {/* Bold, Italic, Underline, Strikethrough */}
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('bold')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black font-bold transition-colors cursor-pointer"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('italic')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black italic transition-colors cursor-pointer"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('underline')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('strikeThrough')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 mx-1" />

        {/* Text Color Picker */}
        <div className="relative">
          <button
            onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
            onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); setShowTableMenu(false); }}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            title="Text Color"
          >
            <Palette className="h-4 w-4" />
          </button>
          {showColorPicker && (
            <div className="absolute left-0 top-full mt-1.5 p-2 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 grid grid-cols-4 gap-1.5 w-36">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                  onClick={() => handleTextColor(c.value)}
                  className="h-6 w-6 rounded-full border border-neutral-200 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
            onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); setShowTableMenu(false); }}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            title="Highlight Color"
          >
            <Highlighter className="h-4 w-4" />
          </button>
          {showHighlightPicker && (
            <div className="absolute left-0 top-full mt-1.5 p-2 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 grid grid-cols-4 gap-1.5 w-36">
              {HIGHLIGHT_COLORS.map((h) => (
                <button
                  key={h.value}
                  onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                  onClick={() => handleHighlight(h.value)}
                  className="h-6 w-6 rounded border border-neutral-300 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: h.value }}
                  title={h.name}
                >
                  {h.value === 'transparent' && '✕'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-neutral-200 mx-1" />

        {/* Alignment */}
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('justifyLeft')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('justifyCenter')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('justifyRight')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('justifyFull')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 mx-1" />

        {/* Lists */}
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Bulleted List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('insertOrderedList')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 mx-1" />

        {/* Insert Table */}
        <div className="relative">
          <button
            onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
            onClick={() => { setShowTableMenu(!showTableMenu); setShowColorPicker(false); setShowHighlightPicker(false); }}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </button>
          {showTableMenu && (
            <div className="absolute left-0 top-full mt-1.5 p-2 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 w-44 space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 block mb-1">Table Grid</span>
              <button
                onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                onClick={() => insertTable(2, 2)}
                className="w-full text-left px-2 py-1.5 text-xs text-neutral-800 hover:bg-neutral-100 rounded cursor-pointer"
              >
                2 × 2 Standard Table
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                onClick={() => insertTable(3, 3)}
                className="w-full text-left px-2 py-1.5 text-xs text-neutral-800 hover:bg-neutral-100 rounded cursor-pointer"
              >
                3 × 3 Matrix Table
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                onClick={() => insertTable(4, 4)}
                className="w-full text-left px-2 py-1.5 text-xs text-neutral-800 hover:bg-neutral-100 rounded cursor-pointer"
              >
                4 × 4 Financial Table
              </button>
            </div>
          )}
        </div>

        {/* Insert Callout / Alert Box */}
        <div className="relative">
          <button
            onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
            onClick={() => { setShowCalloutMenu(!showCalloutMenu); setShowTableMenu(false); }}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
            title="Insert Callout Box"
          >
            <Info className="h-4 w-4" />
          </button>
          {showCalloutMenu && (
            <div className="absolute left-0 top-full mt-1.5 p-2 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 w-40 space-y-1">
              <button
                onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                onClick={() => insertCallout('info')}
                className="w-full text-left px-2 py-1.5 text-xs text-blue-800 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer font-medium"
              >
                ℹ️ Note / Memo Box
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                onClick={() => insertCallout('warning')}
                className="w-full text-left px-2 py-1.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 rounded cursor-pointer font-medium"
              >
                ⚠️ Warning / Protocol
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
                onClick={() => insertCallout('success')}
                className="w-full text-left px-2 py-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded cursor-pointer font-medium"
              >
                ✅ Approved / Success
              </button>
            </div>
          )}
        </div>

        {/* Signature Block */}
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={insertSignatureBlock}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Insert Official Signature Block"
        >
          <FileSignature className="h-4 w-4" />
        </button>

        {/* Divider / Horizontal Line */}
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={() => execCmd('insertHorizontalRule')}
          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black transition-colors cursor-pointer"
          title="Insert Horizontal Divider"
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Page Break */}
        <button
          onMouseDown={(e) => { e.preventDefault(); saveCurrentSelection(); }}
          onClick={insertPageBreak}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black text-xs font-medium transition-colors cursor-pointer"
          title="Insert New Page Break"
        >
          <FilePlus2 className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Page Break</span>
        </button>
      </div>

      {/* 3. Paginated Paper Canvas View & AI Side Panel */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar py-8 px-4 sm:px-8 flex justify-center bg-[#f3f4f6] select-text cursor-text">
          {/* White Paper Page Sheet (A4 / US Letter Dimensions) */}
          <div className="w-full max-w-[816px] min-h-[1056px] bg-white rounded-sm shadow-md border border-neutral-300/80 px-12 sm:px-16 py-14 text-neutral-900 transition-all focus-within:shadow-lg focus-within:border-neutral-400 mb-12 select-text cursor-text">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onMouseUp={saveCurrentSelection}
              onKeyUp={saveCurrentSelection}
              className="outline-none min-h-[900px] leading-relaxed text-[15px] cursor-text select-text relative z-10"
              style={{
                fontFamily: currentFont,
                fontSize: currentSize,
              }}
            />
          </div>
        </div>

        {/* Gemini-style Document AI Side Panel */}
        {isAIPanelOpen && (
          <DocumentAISidePanel
            documentTitle={title}
            documentContent={editorRef.current?.innerHTML || ''}
            documentCategory={category}
            onClose={() => setIsAIPanelOpen(false)}
            onInsertContent={(content) => {
              editorRef.current?.focus()
              const formatted = content.includes('<') && content.includes('>')
                ? content
                : content
                    .split('\n\n')
                    .map((b) => `<p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 12px;">${b.replace(/\n/g, '<br>')}</p>`)
                    .join('')
              document.execCommand('insertHTML', false, formatted)
              triggerAutoSave()
            }}
          />
        )}
      </div>

      {/* 4. Bottom Status Bar */}
      <div className="h-7 bg-white border-t border-neutral-200 px-4 flex items-center justify-between text-[11px] text-neutral-500 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span>{wordCount.toLocaleString()} words</span>
          <span>•</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span>•</span>
          <span>~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="uppercase">{category}</span>
          <span>•</span>
          <span>100% Offline</span>
        </div>
      </div>
    </div>
  )
}
