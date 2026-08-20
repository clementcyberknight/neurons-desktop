import React from 'react'
import { ShieldAlert, AlertTriangle, Check, Plus } from 'lucide-react'
import type { RedFlagAlertSchema } from '@/types/schemas'
import { db } from '@/db/localDb'

interface Props {
  data: RedFlagAlertSchema
  onApply?: () => void
}

export const RedFlagAlertCard: React.FC<Props> = ({ data, onApply }) => {
  const [applied, setApplied] = React.useState(false)

  const handleLogAlert = async () => {
    try {
      const now = Date.now()
      await db.alerts.add({
        id: `alt-ai-${now}`,
        title: `${data.anomaly_type.replace(/_/g, ' ')} (${data.severity})`,
        severity: data.severity,
        module: data.flagged_module,
        anomalyType: data.anomaly_type,
        reasoning: data.reasoning,
        recommendedAction: data.recommended_action,
        isAcknowledged: false,
        transactionId: data.transaction_id || undefined,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      })
      setApplied(true)
      if (onApply) onApply()
    } catch (e) {
      console.error('Failed to log alert:', e)
    }
  }

  const severityColor = {
    CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-400',
    HIGH: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    MEDIUM: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    LOW: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  }[data.severity] || 'bg-red-500/10 border-red-500/30 text-red-400'

  return (
    <div className={`rounded-xl border p-4 shadow-lg my-2 ${severityColor}`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold tracking-tight text-white">Security & Audit Alert</h4>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {data.severity}
              </span>
            </div>
            <span className="text-xs opacity-80 font-mono">Module: {data.flagged_module}</span>
          </div>
        </div>
        <button
          onClick={handleLogAlert}
          disabled={applied}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            applied
              ? 'bg-white/20 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
          }`}
        >
          {applied ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {applied ? 'Logged' : 'Log Alert'}
        </button>
      </div>

      <div className="space-y-2 text-xs text-slate-200">
        <div>
          <span className="font-semibold text-white">Anomaly: </span>
          <code className="bg-black/30 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-300">
            {data.anomaly_type}
          </code>
          {data.transaction_id && (
            <span className="ml-2 font-mono opacity-80">(Ref: {data.transaction_id})</span>
          )}
        </div>
        <p className="leading-relaxed"><strong className="text-white">Reasoning: </strong>{data.reasoning}</p>
        <div className="rounded-lg bg-black/30 p-2.5 border border-white/10 text-emerald-300">
          <strong className="text-white">Recommended Action: </strong>{data.recommended_action}
        </div>
      </div>
    </div>
  )
}
