import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  generateAI: (params: { prompt: string; systemPrompt?: string; temperature?: number }) => Promise<any>
  checkAIStatus: () => Promise<boolean>
  exportData: (jsonData: string) => Promise<boolean>
  getPlatformInfo: () => Promise<{ platform: string; arch: string; version: string }>
}

const api: ElectronAPI = {
  generateAI: (params) => ipcRenderer.invoke('ai:generate', params),
  checkAIStatus: () => ipcRenderer.invoke('ai:status'),
  exportData: (jsonData) => ipcRenderer.invoke('app:export-data', jsonData),
  getPlatformInfo: () => ipcRenderer.invoke('app:info'),
}

contextBridge.exposeInMainWorld('electronAPI', api)
