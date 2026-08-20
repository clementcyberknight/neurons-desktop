import React from 'react'
import { BarChart3, PieChart, TrendingUp, Check, Plus } from 'lucide-react'
import type { GenerativeChartSchema } from '@/types/schemas'
import { db } from '@/db/localDb'

interface Props {
  data: GenerativeChartSchema
  onApply?: () => void
}

export const GenerativeChartCard: React.FC<Props> = ({ data, onApply }) => {
  const [applied, setApplied] = React.useState(false)

  const dataset = data.data.datasets[0] || { label: 'Data', values: [] }
  const labels = data.data.labels || []
  const values = dataset.values || []
  const maxValue = Math.max(...values, 1)

  const colors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
  ]

  const handleApply = async () => {
    setApplied(true)
    if (onApply) onApply()
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg text-slate-100 my-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            {data.chart_type === 'pie' ? <PieChart className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight">{data.title}</h4>
            <span className="text-xs text-slate-400 uppercase font-mono">{data.chart_type} Chart • {dataset.label}</span>
          </div>
        </div>
        <button
          onClick={handleApply}
          disabled={applied}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            applied
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
          }`}
        >
          {applied ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {applied ? 'Applied' : 'Save Chart'}
        </button>
      </div>

      {/* Bar Representation */}
      <div className="space-y-2.5 my-3">
        {labels.map((label, idx) => {
          const val = values[idx] || 0
          const pct = Math.round((val / maxValue) * 100)
          const color = colors[idx % colors.length]
          return (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{label}</span>
                <span className="font-mono text-slate-400">{val.toLocaleString()} units ({pct}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* AI Summary */}
      {data.summary && (
        <div className="mt-3 rounded-lg bg-slate-800/60 p-2.5 text-xs text-slate-300 leading-relaxed border border-slate-700/50">
          <span className="font-semibold text-emerald-400">Insight: </span>
          {data.summary}
        </div>
      )}
    </div>
  )
}
