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

export interface ElectronAPI {
  generateAI: (params: { prompt: string; systemPrompt?: string; temperature?: number }) => Promise<ElectronLLMResponse>
  checkAIStatus: () => Promise<boolean>
  exportData: (jsonData: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
  getPlatformInfo: () => Promise<{ platform: string; arch: string; version: string }>
  openExternal: (url: string) => Promise<void> | void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
