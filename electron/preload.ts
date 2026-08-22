import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  generateAI: (params: { prompt: string; systemPrompt?: string; temperature?: number; maxTokens?: number }) => Promise<any>
  checkAIStatus: () => Promise<{ exists: boolean; path?: string; sizeBytes?: number }>
  downloadAIModel: () => Promise<{ success: boolean; filePath: string }>
  onAIDownloadProgress: (callback: (progress: any) => void) => () => void
  exportData: (jsonData: string) => Promise<boolean>
  openExternal: (url: string) => Promise<boolean>
  getPlatformInfo: () => Promise<{ platform: string; arch: string; version: string }>
}

const api: ElectronAPI = {
  generateAI: (params) => ipcRenderer.invoke('ai:generate', params),
  checkAIStatus: () => ipcRenderer.invoke('ai:status'),
  downloadAIModel: () => ipcRenderer.invoke('ai:download-model'),
  onAIDownloadProgress: (callback) => {
    const handler = (_: any, progress: any) => callback(progress)
    ipcRenderer.on('ai:download-progress', handler)
    return () => ipcRenderer.removeListener('ai:download-progress', handler)
  },
  exportData: (jsonData) => ipcRenderer.invoke('app:export-data', jsonData),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  getPlatformInfo: () => ipcRenderer.invoke('app:info'),
}

contextBridge.exposeInMainWorld('electronAPI', api)
