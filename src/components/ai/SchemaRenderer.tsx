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
  schema?: LLMOutputSchema
  rawText: string
  onApplyAction?: () => void
}

export const SchemaRenderer: React.FC<Props> = ({ schema, rawText, onApplyAction }) => {
  if (!schema || typeof schema !== 'object') {
    return (
      <div className="prose prose-sm text-neutral-800 leading-relaxed break-words">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {rawText}
        </ReactMarkdown>
      </div>
    )
  }

  const outputType = schema.output_type

  switch (outputType) {
    case 'GENERATIVE_CHART':
      return <GenerativeChartCard data={schema} onApply={onApplyAction} />
    case 'SHIFT_SCHEDULE':
      return <ShiftScheduleCard data={schema} onApply={onApplyAction} />
    case 'RED_FLAG_ALERT':
      return <RedFlagAlertCard data={schema} onApply={onApplyAction} />
    case 'AUTO_TASK':
      return <AutoTaskCard data={schema} onApply={onApplyAction} />
    case 'DOCUMENT_OUTPUT':
      return <DocumentCard data={schema} onApply={onApplyAction} />
    case 'DEEP_RESEARCH':
      return <DeepResearchCard data={schema} />
    case 'CONVERSATIONAL_CHAT':
      return (
        <div className="prose prose-sm text-neutral-800 leading-relaxed break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {schema.message || rawText}
          </ReactMarkdown>
        </div>
      )
    default:
      return (
        <div className="space-y-2">
          <div className="prose prose-sm text-neutral-800 leading-relaxed break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {rawText}
            </ReactMarkdown>
          </div>
        </div>
      )
  }
}
