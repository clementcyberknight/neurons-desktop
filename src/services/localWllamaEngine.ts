import { Wllama } from '@wllama/wllama'
import { aiModelDownloader } from './aiModelDownloader'
import type { LLMOutputSchema } from '@/types/schemas'

export interface LocalGenerateOptions {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  history?: { role: 'user' | 'assistant' | 'system'; content: string }[]
  onToken?: (token: string) => void
}

export interface LocalGenerateResult {
  raw: string
  parsedJson?: LLMOutputSchema
  outputType: string
  latencyMs: number
  tokensPerSecond: number
}

export class LocalWllamaEngine {
  private wllama: Wllama | null = null
  private isLoaded: boolean = false
  private isLoading: boolean = false
  private loadError: string | null = null

  async init(): Promise<boolean> {
    if (this.isLoaded && this.wllama) {
      return true
    }

    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise((r) => setTimeout(r, 200))
      }
      return this.isLoaded
    }

    this.isLoading = true
    this.loadError = null

    try {
      const isDownloaded = await aiModelDownloader.isModelDownloaded()
      if (!isDownloaded) {
        this.isLoading = false
        return false
      }

      const file = await aiModelDownloader.getLocalModelFile()
      if (!file) {
        this.isLoading = false
        return false
      }

      const wasmPath = '/wllama/wllama.wasm'

      this.wllama = new Wllama({
        default: wasmPath,
        'single-thread/wllama.wasm': wasmPath,
        'multi-thread/wllama.wasm': wasmPath,
      })

      await this.wllama.loadModel([file], {
        n_ctx: 2048,
        n_threads: 4,
      })

      this.isLoaded = true
      this.isLoading = false
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[LocalWllamaEngine] Failed to load local GGUF model into WebAssembly:', err)
      this.loadError = errorMsg
      this.isLoaded = false
      this.isLoading = false
      return false
    }
  }

  isModelReady(): boolean {
    return this.isLoaded
  }

  getLoadError(): string | null {
    return this.loadError
  }

  async generate(options: LocalGenerateOptions): Promise<LocalGenerateResult> {
    const t0 = Date.now()

    const ready = await this.init()
    if (!ready || !this.wllama) {
      throw new Error(this.loadError || 'Local GGUF model is not loaded in memory.')
    }

    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = []

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt })
    }

    if (options.history?.length) {
      for (const h of options.history) {
        messages.push({ role: h.role, content: h.content })
      }
    }

    messages.push({ role: 'user', content: options.prompt })

    const response = await this.wllama.createChatCompletion({
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 384,
    })

    const raw = response.choices?.[0]?.message?.content || ''
    const latencyMs = Date.now() - t0
    const wordCount = raw.split(/\s+/).filter(Boolean).length
    const tokensPerSecond = latencyMs > 0 ? wordCount / (latencyMs / 1000) : 0

    let cleanText = raw.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    try {
      const parsed = JSON.parse(cleanText)
      if (parsed && typeof parsed === 'object' && parsed.output_type) {
        return {
          raw: parsed.message || cleanText,
          parsedJson: parsed.output_type === 'CONVERSATIONAL_CHAT' ? undefined : (parsed as LLMOutputSchema),
          outputType: parsed.output_type || 'CONVERSATIONAL_CHAT',
          latencyMs,
          tokensPerSecond,
        }
      }
    } catch {
      // Conversational output
    }

    return {
      raw,
      outputType: 'CONVERSATIONAL_CHAT',
      latencyMs,
      tokensPerSecond,
    }
  }
}

export const localWllamaEngine = new LocalWllamaEngine()
