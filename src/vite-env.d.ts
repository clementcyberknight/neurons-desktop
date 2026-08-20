/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    generateAI: (params: { prompt: string; systemPrompt?: string; temperature?: number }) => Promise<any>
    checkAIStatus: () => Promise<boolean>
    exportData: (jsonData: string) => Promise<boolean>
    getPlatformInfo: () => Promise<{ platform: string; arch: string; version: string }>
  }
}
