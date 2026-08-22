/// <reference types="vite/client" />

export interface ElectronLLMResponse {
  raw: string
  parsedJson?: Record<string, unknown>
  outputType: string
  tokensPerSecond?: number
  latencyMs?: number
  data?: string
  error?: string
}

export interface ElectronModelStatus {
  exists: boolean
  path?: string
  sizeBytes?: number
}

export interface ElectronDownloadProgress {
  percent: number
  loadedBytes: number
  totalBytes: number
  loadedMB: number
  totalMB: number
  speedMBps: number
  etaSeconds: number
}

export interface ElectronAPI {
  generateAI: (params: { prompt: string; systemPrompt?: string; temperature?: number; maxTokens?: number }) => Promise<ElectronLLMResponse>
  checkAIStatus: () => Promise<ElectronModelStatus>
  downloadAIModel: () => Promise<{ success: boolean; filePath: string }>
  onAIDownloadProgress: (callback: (progress: ElectronDownloadProgress) => void) => () => void
  exportData: (jsonData: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
  getPlatformInfo: () => Promise<{ platform: string; arch: string; version: string }>
  openExternal: (url: string) => Promise<void> | void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
