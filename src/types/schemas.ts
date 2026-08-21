// ADTC 2026 Custom Schema Definitions for bau-small-1.5b

export interface GenerativeChartSchema {
  output_type: 'GENERATIVE_CHART'
  chart_type: 'bar' | 'pie' | 'line' | 'doughnut'
  title: string
  summary: string
  data: {
    labels: string[]
    datasets: {
      label: string
      values: number[]
      backgroundColor?: string[]
      borderColor?: string
    }[]
  }
}

export interface RedFlagAlertSchema {
  output_type: 'RED_FLAG_ALERT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  flagged_module: string
  anomaly_type: string
  transaction_id: string | null
  reasoning: string
  recommended_action: string
}

export interface ShiftScheduleSchema {
  output_type: 'SHIFT_SCHEDULE'
  week_starting: string
  schedule: {
    staff_id: string
    name: string
    role: string
    day: string
    shift: string
  }[]
}

export interface AutoTaskSchema {
  output_type: 'AUTO_TASK'
  task_title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  assignee_role: string
  due_date: string
  subtasks: string[]
}

export interface DocumentOutputSchema {
  output_type: 'DOCUMENT_OUTPUT'
  doc_title: string
  format: 'markdown' | 'text'
  content: string
}

export interface DeepResearchSchema {
  output_type: 'DEEP_RESEARCH'
  target_sources: string[]
  search_queries: string[]
  sources: {
    title: string
    type: string
    record_id: string
    relevance: string
  }[]
  response: string
}

export interface ConversationalChatSchema {
  output_type: 'CONVERSATIONAL_CHAT'
  message: string
}

export interface ToolCallSchema {
  output_type: 'TOOL_CALL'
  module: string
  endpoint: string
  parameters: Record<string, string | number | boolean | null | undefined>
}

export interface ActionConfirmationSchema {
  output_type: 'ACTION_CONFIRMATION'
  action_name: string
  target_module: string
  impact_summary: string
  requires_auth: boolean
}

export type LLMOutputSchema =
  | GenerativeChartSchema
  | RedFlagAlertSchema
  | ShiftScheduleSchema
  | AutoTaskSchema
  | DocumentOutputSchema
  | DeepResearchSchema
  | ConversationalChatSchema
  | ToolCallSchema
  | ActionConfirmationSchema
