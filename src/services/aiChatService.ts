import { apiClient } from './apiClient'
import { db } from '@/db/localDb'
import { aiModelDownloader } from './aiModelDownloader'
import { localWllamaEngine } from './localWllamaEngine'
import type { LLMOutputSchema } from '@/types/schemas'
import type { AIModelMode, UserProfile, AppSettings } from '@/types/database'

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIChatOptions {
  thinkMode?: boolean
  history?: AIChatMessage[]
  currentModule?: string
  systemPrompt?: string
}

export interface AIChatResponse {
  raw: string
  parsedJson?: LLMOutputSchema
  outputType: string
  latencyMs: number
  engineMode: AIModelMode
}

export interface WorkspaceContext {
  companyName: string
  userRole: string
  currency: string
  aiMode: AIModelMode
  localModelReady: boolean
}

export class AIChatService {
  async getWorkspaceContext(): Promise<WorkspaceContext> {
    let companyName = 'Workspace'
    let userRole = 'admin'
    let currency = 'NGN'
    let aiMode: AIModelMode = 'local_800mb'

    try {
      const settings: AppSettings | undefined = await db.appSettings.get('global-settings')
      if (settings?.aiModelMode) {
        aiMode = settings.aiModelMode
      }

      const activeUserId = localStorage.getItem('neurons_active_user_id')
      if (activeUserId) {
        const profile: UserProfile | undefined = await db.userProfile.get(activeUserId)
        if (profile) {
          companyName = profile.companyName || companyName
          userRole = profile.role || userRole
          if (profile.aiModelMode) {
            aiMode = profile.aiModelMode
          }
        }
      }
    } catch (dbError) {
      console.warn('[AIChatService] Unable to read local workspace context from database:', dbError)
    }

    let localModelReady = false
    if (typeof window !== 'undefined' && window.electronAPI?.checkAIStatus) {
      try {
        const status = await window.electronAPI.checkAIStatus()
        localModelReady = Boolean(status.exists)
      } catch {
        localModelReady = false
      }
    } else {
      localModelReady = await aiModelDownloader.isModelDownloaded()
    }

    return {
      companyName,
      userRole,
      currency,
      aiMode,
      localModelReady,
    }
  }

  async sendMessage(prompt: string, options: AIChatOptions = {}): Promise<AIChatResponse> {
    const t0 = Date.now()
    const context = await this.getWorkspaceContext()

    const contextPayload = {
      companyName: context.companyName,
      userRole: context.userRole,
      currency: context.currency,
      currentModule: options.currentModule,
      inferenceMode: context.aiMode,
    }

    if (context.aiMode === 'local_800mb') {
      // 1. Native Desktop Electron Inference with node-llama-cpp
      if (typeof window !== 'undefined' && window.electronAPI?.generateAI) {
        try {
          const status = await window.electronAPI.checkAIStatus()
          if (status.exists) {
            const electronResult = await window.electronAPI.generateAI({
              prompt,
              systemPrompt: options.systemPrompt,
              temperature: options.thinkMode ? 0.4 : 0.2,
              maxTokens: 2048,
            })

            return {
              raw: electronResult.raw,
              parsedJson: electronResult.parsedJson as unknown as LLMOutputSchema | undefined,
              outputType: electronResult.outputType || 'CONVERSATIONAL_CHAT',
              latencyMs: electronResult.latencyMs || Date.now() - t0,
              engineMode: 'local_800mb',
            }
          }
        } catch (electronErr: unknown) {
          const errMsg = electronErr instanceof Error ? electronErr.message : String(electronErr)
          console.error('[AIChatService] Native Electron local inference error:', errMsg)
          return {
            raw: `⚠️ **Local AI Engine Error**\n\n${errMsg}\n\nPlease try sending your message again.`,
            outputType: 'CONVERSATIONAL_CHAT',
            latencyMs: Date.now() - t0,
            engineMode: 'local_800mb',
          }
        }
      }

      // 2. Browser WebAssembly Inference
      if (context.localModelReady) {
        try {
          const wllamaResult = await localWllamaEngine.generate({
            prompt,
            systemPrompt: options.systemPrompt,
            temperature: options.thinkMode ? 0.4 : 0.2,
            history: options.history,
          })

          return {
            raw: wllamaResult.raw,
            parsedJson: wllamaResult.parsedJson,
            outputType: wllamaResult.outputType,
            latencyMs: wllamaResult.latencyMs,
            engineMode: 'local_800mb',
          }
        } catch (wllamaErr: unknown) {
          const errMsg = wllamaErr instanceof Error ? wllamaErr.message : String(wllamaErr)
          console.error('[AIChatService] Local WebAssembly inference error:', errMsg)
          return {
            raw: `⚠️ **Local AI Engine Error**\n\n${errMsg}\n\nPlease try sending your message again.`,
            outputType: 'CONVERSATIONAL_CHAT',
            latencyMs: Date.now() - t0,
            engineMode: 'local_800mb',
          }
        }
      }

      return {
        raw: '⚠️ **Local AI Model (698 MB) is not yet downloaded on this device.**\n\nTo use on-device local AI with 100% offline autonomy, please download the `bau-small-1.5b.gguf` model from Hugging Face.',
        outputType: 'CONVERSATIONAL_CHAT',
        latencyMs: Date.now() - t0,
        engineMode: 'local_800mb',
      }
    }

    // 3. Fallback / Cloud API
    try {
      const result = await apiClient.generateAI({
        prompt,
        systemPrompt: options.systemPrompt,
        thinkMode: options.thinkMode,
        history: options.history,
        context: contextPayload,
      })

      return {
        raw: result.raw,
        parsedJson: result.parsedJson as unknown as LLMOutputSchema | undefined,
        outputType: result.outputType || 'CONVERSATIONAL_CHAT',
        latencyMs: result.latencyMs || Date.now() - t0,
        engineMode: context.aiMode,
      }
    } catch (apiErr) {
      console.error('[AIChatService] AI query failed on backend endpoint:', apiErr)
      throw apiErr
    }
  }
}

export const aiChatService = new AIChatService()
