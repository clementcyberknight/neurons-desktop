/// <reference types="vite/client" />

export interface ElectronAPI {
  generateAI: (params: { prompt: string; systemPrompt?: string; temperature?: number }) => Promise<{ success: boolean; data?: string; error?: string }>
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
