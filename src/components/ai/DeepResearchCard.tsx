import React from 'react'
import { Search, Database, ExternalLink, BookOpen } from 'lucide-react'
import type { DeepResearchSchema } from '@/types/schemas'

interface Props {
  data: DeepResearchSchema
}

export const DeepResearchCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg text-slate-100 my-2">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
          <Search className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-tight">Forensic Research & Audit Synthesis</h4>
          <span className="text-xs text-slate-400 font-mono">
            Sources scanned: {data.target_sources?.join(', ') || 'Internal Logs'}
          </span>
        </div>
      </div>

      {/* Synthesis */}
      <div className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-200 leading-relaxed border border-slate-700/50 mb-3">
        <span className="font-semibold text-cyan-400">Findings: </span>
        {data.response}
      </div>

      {/* Sources list */}
      {data.sources && data.sources.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Database className="h-3 w-3" /> Cited Sources & Records
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.sources.map((src, idx) => (
              <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs">
                <div className="flex items-center justify-between font-medium text-slate-200">
                  <span className="truncate">{src.title}</span>
                  <span className="text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950/80 px-1 rounded">
                    {src.relevance}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center justify-between">
                  <span>{src.type}</span>
                  <span className="text-slate-400">{src.record_id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
