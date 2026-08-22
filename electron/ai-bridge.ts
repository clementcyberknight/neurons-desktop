import { spawn, ChildProcess } from 'node:child_process'
import path from 'node:path'
import http from 'node:http'

export interface LLMRequest {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface LLMResponse {
  raw: string
  parsedJson?: Record<string, any>
  outputType: string
  tokensPerSecond?: number
  latencyMs?: number
}

export class AIBridge {
  private serverProcess: ChildProcess | null = null
  private serverPort = 8080
  private isServerReady = false

  constructor() {
    this.checkLocalServer()
  }

  private checkLocalServer(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${this.serverPort}/health`, (res) => {
        this.isServerReady = res.statusCode === 200
        resolve(this.isServerReady)
      })
      req.on('error', () => {
        this.isServerReady = false
        resolve(false)
      })
      req.setTimeout(1000, () => {
        req.destroy()
        this.isServerReady = false
        resolve(false)
      })
    })
  }

  async generate(req: LLMRequest): Promise<LLMResponse> {
    const t0 = Date.now()

    // 1. If llama-server is running locally on 8080, query its OpenAI compatible endpoint
    const hasServer = await this.checkLocalServer()
    if (hasServer) {
      try {
        const res = await this.queryLlamaServer(req)
        const latencyMs = Date.now() - t0
        return this.processOutput(res, latencyMs)
      } catch (err) {
        console.warn('llama-server query error, using offline local engine fallback:', err)
      }
    }

    // 2. Query Cloud Backend AI if local llama-server is not running
    try {
      const backendUrl = process.env.VITE_BACKEND_URL || 'https://neurons.savewithliquid.xyz'
      const response = await fetch(`${backendUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: req.prompt,
          systemPrompt: req.systemPrompt,
          temperature: req.temperature,
          maxTokens: req.maxTokens,
        }),
      })

      if (response.ok) {
        const json = (await response.json()) as {
          status: string
          data: { raw: string; parsedJson?: Record<string, any>; outputType: string }
        }
        const latencyMs = Date.now() - t0
        return {
          raw: json.data.raw,
          parsedJson: json.data.parsedJson,
          outputType: json.data.outputType || 'CONVERSATIONAL_CHAT',
          latencyMs,
        }
      }
    } catch (err) {
      console.warn('Backend AI generation unavailable:', err)
    }

    const latencyMs = Date.now() - t0
    return {
      raw: '⚠️ Local inference engine is currently offline. Please ensure the local GGUF server is started or switch to Cloud API mode.',
      outputType: 'CONVERSATIONAL_CHAT',
      latencyMs,
    }
  }

  private queryLlamaServer(req: LLMRequest): Promise<string> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        messages: [
          ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
          { role: 'user', content: req.prompt }
        ],
        temperature: req.temperature ?? 0.2,
        max_tokens: req.maxTokens ?? 384,
      })

      const options = {
        hostname: '127.0.0.1',
        port: this.serverPort,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      }

      const request = http.request(options, (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            const content = parsed.choices?.[0]?.message?.content || body
            resolve(content)
          } catch {
            resolve(body)
          }
        })
      })

      request.on('error', (e) => reject(e))
      request.write(postData)
      request.end()
    })
  }

  private processOutput(rawText: string, latencyMs: number): LLMResponse {
    let cleanText = rawText.trim()
    
    // Remove code fences if any were emitted
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    try {
      const parsed = JSON.parse(cleanText)
      return {
        raw: parsed.message || cleanText,
        parsedJson: parsed.output_type === 'CONVERSATIONAL_CHAT' ? undefined : parsed,
        outputType: parsed.output_type || 'STRUCTURED_JSON',
        tokensPerSecond: cleanText.length > 0 ? (cleanText.split(/\s+/).length / (latencyMs / 1000)) : 0,
        latencyMs,
      }
    } catch {
      return {
        raw: rawText,
        outputType: 'CONVERSATIONAL_CHAT',
        tokensPerSecond: rawText.length > 0 ? (rawText.split(/\s+/).length / (latencyMs / 1000)) : 0,
        latencyMs,
      }
    }
  }
}
