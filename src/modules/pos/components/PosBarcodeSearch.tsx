import React from 'react'
import { Barcode, Filter, CornerDownLeft } from 'lucide-react'

interface PosBarcodeSearchProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export const PosBarcodeSearch: React.FC<PosBarcodeSearchProps> = ({
  searchTerm,
  onSearchChange,
  onSubmit,
  inputRef,
}) => {
  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="flex items-center rounded-2xl border border-neutral-300 bg-white shadow-xs px-3.5 py-2.5 transition-all focus-within:border-black focus-within:ring-1 focus-within:ring-black">
        <Barcode className="h-5 w-5 text-neutral-400 mr-2.5 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Scan barcode or search..."
          className="w-full bg-transparent text-sm font-medium text-black placeholder-neutral-400 focus:outline-none"
        />
        <div className="flex items-center gap-2 text-neutral-400 shrink-0">
          <button type="button" className="p-1 hover:text-black cursor-pointer" title="Filter list">
            <Filter className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-neutral-200" />
          <button type="submit" className="p-1 hover:text-black cursor-pointer" title="Enter barcode">
            <CornerDownLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  )
}
