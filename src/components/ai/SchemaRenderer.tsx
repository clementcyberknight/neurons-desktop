import React from 'react'
import type { LLMOutputSchema } from '@/types/schemas'
import { GenerativeChartCard } from './GenerativeChartCard'
import { ShiftScheduleCard } from './ShiftScheduleCard'
import { RedFlagAlertCard } from './RedFlagAlertCard'
import { AutoTaskCard } from './AutoTaskCard'
import { DeepResearchCard } from './DeepResearchCard'
import { DocumentCard } from './DocumentCard'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  schema?: Record<string, any>
  rawText: string
  onApplyAction?: () => void
}

export const SchemaRenderer: React.FC<Props> = ({ schema, rawText, onApplyAction }) => {
  if (!schema || typeof schema !== 'object') {
    return (
      <div className="prose prose-invert prose-sm text-slate-200 leading-relaxed break-words">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {rawText}
        </ReactMarkdown>
      </div>
    )
  }

  const outputType = schema.output_type

  switch (outputType) {
    case 'GENERATIVE_CHART':
      return <GenerativeChartCard data={schema as any} onApply={onApplyAction} />
    case 'SHIFT_SCHEDULE':
      return <ShiftScheduleCard data={schema as any} onApply={onApplyAction} />
    case 'RED_FLAG_ALERT':
      return <RedFlagAlertCard data={schema as any} onApply={onApplyAction} />
    case 'AUTO_TASK':
      return <AutoTaskCard data={schema as any} onApply={onApplyAction} />
    case 'DOCUMENT_OUTPUT':
      return <DocumentCard data={schema as any} onApply={onApplyAction} />
    case 'DEEP_RESEARCH':
      return <DeepResearchCard data={schema as any} />
    case 'CONVERSATIONAL_CHAT':
      return (
        <div className="prose prose-invert prose-sm text-slate-200 leading-relaxed break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {schema.message || rawText}
          </ReactMarkdown>
        </div>
      )
    default:
      return (
        <div className="space-y-2">
          {schema.message ? (
            <p className="text-slate-200 text-sm leading-relaxed">{schema.message}</p>
          ) : (
            <div className="prose prose-invert prose-sm text-slate-200 leading-relaxed break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {rawText}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )
  }
}
