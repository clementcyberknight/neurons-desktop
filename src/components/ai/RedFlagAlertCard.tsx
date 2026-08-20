import React from 'react'
import { ShieldAlert, Check, Plus } from 'lucide-react'
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

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-2xs text-amber-950 my-2">
      <div className="flex items-center justify-between border-b border-amber-200 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold tracking-tight text-neutral-900">Security & Audit Alert</h4>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 border border-amber-300">
                {data.severity}
              </span>
            </div>
            <span className="text-xs text-neutral-600 font-mono">Module: {data.flagged_module}</span>
          </div>
        </div>
        <button
          onClick={handleLogAlert}
          disabled={applied}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            applied
              ? 'bg-neutral-200 text-neutral-800'
              : 'bg-black hover:bg-neutral-800 text-white shadow-xs'
          }`}
        >
          {applied ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {applied ? 'Logged' : 'Log Alert'}
        </button>
      </div>

      <div className="space-y-2 text-xs text-neutral-800">
        <div>
          <span className="font-semibold text-neutral-900">Anomaly: </span>
          <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-900 border border-amber-200">
            {data.anomaly_type}
          </code>
          {data.transaction_id && (
            <span className="ml-2 font-mono text-neutral-500">(Ref: {data.transaction_id})</span>
          )}
        </div>
        <p className="leading-relaxed"><strong className="text-neutral-900">Reasoning: </strong>{data.reasoning}</p>
        <div className="rounded-lg bg-white p-2.5 border border-amber-200 text-neutral-900">
          <strong className="text-neutral-900">Recommended Action: </strong>{data.recommended_action}
        </div>
      </div>
    </div>
  )
}
