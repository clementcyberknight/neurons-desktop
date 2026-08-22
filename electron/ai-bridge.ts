import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import https from 'node:https'
import type { Llama, LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp'

export interface LLMRequest {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface LLMResponse {
  raw: string
  parsedJson?: Record<string, unknown>
  outputType: string
  tokensPerSecond?: number
  latencyMs?: number
}

export interface ModelDownloadProgress {
  percent: number
  loadedBytes: number
  totalBytes: number
  loadedMB: number
  totalMB: number
  speedMBps: number
  etaSeconds: number
}

export class AIBridge {
  private llama: Llama | null = null
  private model: LlamaModel | null = null
  private context: LlamaContext | null = null
  private session: LlamaChatSession | null = null
  private isInitializing = false

  getModelPaths(): string[] {
    const homeDir = os.homedir()
    return [
      path.join(homeDir, '.neurons', 'models', 'bau-small-1.5b.gguf'),
      path.join(process.cwd(), 'models', 'bau-small-1.5b.gguf'),
      path.join(process.cwd(), 'bau-small-1.5b.gguf'),
    ]
  }

  findExistingModelPath(): string | null {
    for (const p of this.getModelPaths()) {
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p)
        if (stats.size > 500 * 1024 * 1024) {
          return p
        }
      }
    }
    return null
  }

  getDefaultModelDestination(): string {
    const dir = path.join(os.homedir(), '.neurons', 'models')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    return path.join(dir, 'bau-small-1.5b.gguf')
  }

  async checkStatus(): Promise<{ exists: boolean; path?: string; sizeBytes?: number }> {
    const existing = this.findExistingModelPath()
    if (existing) {
      const stats = fs.statSync(existing)
      return { exists: true, path: existing, sizeBytes: stats.size }
    }
    return { exists: false }
  }

  async downloadModel(onProgress?: (progress: ModelDownloadProgress) => void): Promise<{ success: boolean; filePath: string }> {
    const destinationPath = this.getDefaultModelDestination()
    const url = 'https://huggingface.co/cyberknine/bau-qwen/resolve/main/bau-small-1.5b.gguf'

    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      let loadedBytes = 0

      const followRedirect = (targetUrl: string) => {
        https.get(targetUrl, (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            followRedirect(response.headers.location)
            return
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download model: HTTP ${response.statusCode}`))
            return
          }

          const totalBytes = parseInt(response.headers['content-length'] || '731701920', 10)
          const fileStream = fs.createWriteStream(destinationPath)

          response.on('data', (chunk) => {
            loadedBytes += chunk.length
            fileStream.write(chunk)

            const elapsedSec = (Date.now() - startTime) / 1000
            const speedMBps = elapsedSec > 0 ? (loadedBytes / (1024 * 1024)) / elapsedSec : 0
            const remainingBytes = Math.max(0, totalBytes - loadedBytes)
            const etaSeconds = speedMBps > 0 ? (remainingBytes / (1024 * 1024)) / speedMBps : 0
            const percent = Math.min(100, Math.floor((loadedBytes / totalBytes) * 100))

            if (onProgress) {
              onProgress({
                percent,
                loadedBytes,
                totalBytes,
                loadedMB: loadedBytes / (1024 * 1024),
                totalMB: totalBytes / (1024 * 1024),
                speedMBps,
                etaSeconds,
              })
            }
          })

          response.on('end', () => {
            fileStream.end(async () => {
              this.model = null
              this.context = null
              this.session = null
              resolve({ success: true, filePath: destinationPath })
            })
          })

          response.on('error', (err) => {
            fileStream.close()
            fs.unlink(destinationPath, () => {})
            reject(err)
          })
        }).on('error', reject)
      }

      followRedirect(url)
    })
  }

  private async getOrInitSession(): Promise<LlamaChatSession> {
    if (this.session) {
      return this.session
    }

    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise((r) => setTimeout(r, 200))
      }
      if (this.session) return this.session
    }

    this.isInitializing = true

    try {
      const modelPath = this.findExistingModelPath()
      if (!modelPath) {
        throw new Error('Local GGUF model is not downloaded on this machine.')
      }

      console.info(`[AIBridge] Initializing node-llama-cpp with model: ${modelPath}`)

      const { getLlama, LlamaChatSession } = await import('node-llama-cpp')

      if (!this.llama) {
        this.llama = await getLlama()
      }

      if (!this.model) {
        this.model = await this.llama.loadModel({ modelPath })
      }

      if (!this.context) {
        this.context = await this.model.createContext({
          contextSize: 8192,
        })
      }

      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
        systemPrompt: 'You are Neurons AI, an offline-first intelligent business copilot for African SMEs.',
      })

      this.isInitializing = false
      return this.session
    } catch (err) {
      this.isInitializing = false
      throw err
    }
  }

  async generate(req: LLMRequest): Promise<LLMResponse> {
    const t0 = Date.now()

    const modelPath = this.findExistingModelPath()
    if (!modelPath) {
      return {
        raw: '⚠️ **Local AI Model (698 MB) is not yet downloaded on this device.**\n\nPlease click the download button to save `bau-small-1.5b.gguf` to disk for 100% offline local inference.',
        outputType: 'CONVERSATIONAL_CHAT',
        latencyMs: 0,
      }
    }

    try {
      const session = await this.getOrInitSession()

      const rawResponse = await session.prompt(req.prompt, {
        temperature: req.temperature ?? 0.2,
        maxTokens: req.maxTokens ?? 2048,
      })

      const latencyMs = Date.now() - t0
      const wordCount = rawResponse.split(/\s+/).filter(Boolean).length
      const tokensPerSecond = latencyMs > 0 ? wordCount / (latencyMs / 1000) : 0

      return this.processOutput(rawResponse, latencyMs, tokensPerSecond)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[AIBridge] node-llama-cpp inference error:', errMsg)

      return {
        raw: `⚠️ **Local Inference Error**: ${errMsg}`,
        outputType: 'CONVERSATIONAL_CHAT',
        latencyMs: Date.now() - t0,
      }
    }
  }

  private processOutput(rawText: string, latencyMs: number, tokensPerSecond: number): LLMResponse {
    let cleanText = rawText.trim()

    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '').trim()
    }

    if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanText)
        if (parsed && typeof parsed === 'object' && typeof parsed.output_type === 'string') {
          const isConversational = parsed.output_type === 'CONVERSATIONAL_CHAT'
          return {
            raw: parsed.message || cleanText,
            parsedJson: isConversational ? undefined : parsed,
            outputType: parsed.output_type,
            tokensPerSecond,
            latencyMs,
          }
        }
      } catch (parseError) {
        console.warn('[AIBridge] Output text contained JSON braces but failed parsing:', parseError)
      }
    }

    return {
      raw: rawText,
      outputType: 'CONVERSATIONAL_CHAT',
      tokensPerSecond,
      latencyMs,
    }
  }
}
