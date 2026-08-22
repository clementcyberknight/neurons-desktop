import { Wllama, type AssetsPathConfig } from '@wllama/wllama'
import { MODEL_METADATA, aiModelDownloader } from './aiModelDownloader'
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

const WLLAMA_ASSETS: AssetsPathConfig = {
  default: '/wllama/wllama.wasm',
  'single-thread/wllama.wasm': '/wllama/wllama.wasm',
  'multi-thread/wllama.wasm': '/wllama/wllama.wasm',
}

function parseModelOutput(
  rawText: string,
  latencyMs: number,
  tokensPerSecond: number
): LocalGenerateResult {
  let cleanText = rawText.trim()

  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '').trim()
  }

  if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
    try {
      const parsed: unknown = JSON.parse(cleanText)
      if (
        parsed &&
        typeof parsed === 'object' &&
        'output_type' in parsed &&
        typeof (parsed as Record<string, unknown>).output_type === 'string'
      ) {
        const parsedRecord = parsed as Record<string, unknown>
        const messageText = typeof parsedRecord.message === 'string' ? parsedRecord.message : cleanText
        const outputType = typeof parsedRecord.output_type === 'string' ? parsedRecord.output_type : 'CONVERSATIONAL_CHAT'
        const isConversational = outputType === 'CONVERSATIONAL_CHAT'

        return {
          raw: messageText,
          parsedJson: isConversational ? undefined : (parsed as LLMOutputSchema),
          outputType,
          latencyMs,
          tokensPerSecond,
        }
      }
    } catch (parseError: unknown) {
      console.warn('[LocalWllamaEngine] Failed to parse JSON-like output, treating as conversational text:', parseError)
    }
  }

  return {
    raw: rawText,
    outputType: 'CONVERSATIONAL_CHAT',
    latencyMs,
    tokensPerSecond,
  }
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
      let waitCount = 0
      while (this.isLoading && waitCount < 50) {
        await new Promise((r) => setTimeout(r, 200))
        waitCount++
      }
      return this.isLoaded
    }

    this.isLoading = true
    this.loadError = null

    try {
      console.info('[LocalWllamaEngine] Initializing WebAssembly GGUF runtime...')

      this.wllama = new Wllama(WLLAMA_ASSETS, {
        allowOffline: true,
        suppressNativeLog: false,
      })

      const file = await aiModelDownloader.getLocalModelFile()
      if (file) {
        console.info(`[LocalWllamaEngine] Loading model from local storage (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`)
        await this.wllama.loadModel([file], {
          n_ctx: 8192,
          n_threads: 4,
        })
      } else {
        console.info('[LocalWllamaEngine] Loading model from URL/Cache...')
        await this.wllama.loadModelFromUrl(MODEL_METADATA.downloadUrl, {
          n_ctx: 8192,
          n_threads: 4,
          useCache: true,
        })
      }

      this.isLoaded = true
      this.isLoading = false
      console.info('[LocalWllamaEngine] Model successfully loaded with 8,192 token context window.')
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[LocalWllamaEngine] Initialization error:', errorMsg)
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

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Local inference timed out (60s).')), 60000)
    })

    const runInference = async (): Promise<LocalGenerateResult> => {
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

      console.info(`[LocalWllamaEngine] Running inference for prompt: "${options.prompt.slice(0, 50)}..."`)

      const response = await this.wllama.createChatCompletion({
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 2048,
      })

      const raw = response.choices?.[0]?.message?.content || ''
      const latencyMs = Date.now() - t0
      const wordCount = raw.split(/\s+/).filter(Boolean).length
      const tokensPerSecond = latencyMs > 0 ? wordCount / (latencyMs / 1000) : 0

      return parseModelOutput(raw, latencyMs, tokensPerSecond)
    }

    return await Promise.race([runInference(), timeoutPromise])
  }
}

export const localWllamaEngine = new LocalWllamaEngine()
