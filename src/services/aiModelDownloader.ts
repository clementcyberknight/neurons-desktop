import { db } from '@/db/localDb'
import { apiClient } from '@/services/apiClient'

export const MODEL_METADATA = {
  repoId: 'cyberknine/bau-qwen',
  filename: 'bau-small-1.5b.gguf',
  downloadUrl: 'https://huggingface.co/cyberknine/bau-qwen/resolve/main/bau-small-1.5b.gguf',
  totalSizeBytes: 731701920, // 697.8 MB
  totalSizeMB: 697.8,
  version: '1.0.0',
  architecture: 'qwen2.5-1.5b-instruct-gguf',
}

const CACHE_NAME = 'neurons-ai-models-v1'

export interface DownloadProgress {
  percent: number
  loadedBytes: number
  totalBytes: number
  loadedMB: number
  totalMB: number
  speedMBps: number
  etaSeconds: number
}

export class AiModelDownloader {
  private abortController: AbortController | null = null
  private isCachedLocally: boolean = false

  /**
   * Multi-Layer Local Storage Verification:
   * 1. Check OPFS (Origin Private File System - direct on-disk SSD storage)
   * 2. Check CacheStorage API
   * 3. Check Backend Local File System (`/api/ai/model/check`)
   * 4. Check Dexie AppSettings
   */
  async isModelDownloaded(): Promise<boolean> {
    if (this.isCachedLocally) {
      return true
    }

    try {
      // 1. Check OPFS (Origin Private File System)
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
        try {
          const root = await navigator.storage.getDirectory()
          const fileHandle = await root.getFileHandle(MODEL_METADATA.filename, { create: false })
          const file = await fileHandle.getFile()
          if (file.size > 100 * 1024 * 1024) {
            this.isCachedLocally = true
            await this.markModelDownloaded()
            return true
          }
        } catch {
          // File does not exist in OPFS yet
        }
      }

      // 2. Check CacheStorage API
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open(CACHE_NAME)
          const cachedResponse = await cache.match(MODEL_METADATA.downloadUrl)
          if (cachedResponse && cachedResponse.ok) {
            this.isCachedLocally = true
            await this.markModelDownloaded()
            return true
          }
        } catch {
          // Not found in cache
        }
      }

      // 3. Check Backend Local Disk
      try {
        const backendStatus = await apiClient.checkModelStatus(MODEL_METADATA.filename)
        if (backendStatus && backendStatus.exists) {
          this.isCachedLocally = true
          await this.markModelDownloaded()
          return true
        }
      } catch {
        // Backend check offline or skipped
      }

      // 4. Check Local Dexie App Settings
      const settings = await db.appSettings.get('global-settings')
      if (settings?.localModelDownloaded) {
        this.isCachedLocally = true
        return true
      }

      return false
    } catch (err) {
      console.warn('[AiModelDownloader] Error during local model check:', err)
      return false
    }
  }

  /**
   * Downloads the model once and writes directly to OPFS and CacheStorage for permanent offline retention.
   */
  async downloadModel(onProgress?: (progress: DownloadProgress) => void): Promise<boolean> {
    // Check if model already exists locally on disk
    if (await this.isModelDownloaded()) {
      if (onProgress) {
        onProgress({
          percent: 100,
          loadedBytes: MODEL_METADATA.totalSizeBytes,
          totalBytes: MODEL_METADATA.totalSizeBytes,
          loadedMB: MODEL_METADATA.totalSizeMB,
          totalMB: MODEL_METADATA.totalSizeMB,
          speedMBps: 0,
          etaSeconds: 0,
        })
      }
      return true
    }

    this.abortController = new AbortController()
    const startTime = Date.now()
    let loadedBytes = 0

    try {
      const response = await fetch(MODEL_METADATA.downloadUrl, {
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch model from Hugging Face: HTTP ${response.status} ${response.statusText}`)
      }

      const contentLength = response.headers.get('content-length')
      const totalBytes = contentLength ? parseInt(contentLength, 10) : MODEL_METADATA.totalSizeBytes

      if (!response.body) {
        throw new Error('ReadableStream not supported on response body')
      }

      // Initialize OPFS direct file writer if available
      let opfsWritable: FileSystemWritableFileStream | null = null
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
        try {
          const root = await navigator.storage.getDirectory()
          const fileHandle = await root.getFileHandle(MODEL_METADATA.filename, { create: true })
          opfsWritable = await fileHandle.createWritable()
        } catch (opfsErr) {
          console.warn('[AiModelDownloader] OPFS writable creation failed, will use CacheStorage:', opfsErr)
        }
      }

      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (value) {
          if (opfsWritable) {
            await opfsWritable.write(value)
          } else {
            chunks.push(value)
          }

          loadedBytes += value.byteLength

          const elapsedSec = (Date.now() - startTime) / 1000
          const speedMBps = elapsedSec > 0 ? loadedBytes / (1024 * 1024) / elapsedSec : 0
          const remainingBytes = Math.max(0, totalBytes - loadedBytes)
          const etaSeconds = speedMBps > 0 ? remainingBytes / (1024 * 1024) / speedMBps : 0
          const percent = Math.min(100, Math.floor((loadedBytes / totalBytes) * 100))

          if (onProgress) {
            onProgress({
              percent,
              loadedBytes,
              totalBytes,
              loadedMB: Number((loadedBytes / (1024 * 1024)).toFixed(1)),
              totalMB: Number((totalBytes / (1024 * 1024)).toFixed(1)),
              speedMBps: Number(speedMBps.toFixed(2)),
              etaSeconds: Math.ceil(etaSeconds),
            })
          }
        }
      }

      // Close OPFS file stream
      if (opfsWritable) {
        await opfsWritable.close()
      } else if (typeof window !== 'undefined' && 'caches' in window && chunks.length > 0) {
        // Fallback store in Cache Storage
        const combinedBlob = new Blob(chunks as BlobPart[], { type: 'application/octet-stream' })
        const cache = await caches.open(CACHE_NAME)
        await cache.put(
          MODEL_METADATA.downloadUrl,
          new Response(combinedBlob, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': String(combinedBlob.size),
            },
          })
        )
      }

      this.isCachedLocally = true
      await this.markModelDownloaded()
      return true
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.info('[AiModelDownloader] Download cancelled by user')
        return false
      }
      console.error('[AiModelDownloader] Download error:', err)
      throw err
    } finally {
      this.abortController = null
    }
  }

  /**
   * Retrieves the locally cached model as a Blob or File handle for inference execution.
   */
  async getLocalModelFile(): Promise<Blob | File | null> {
    try {
      // 1. Try OPFS
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
        try {
          const root = await navigator.storage.getDirectory()
          const fileHandle = await root.getFileHandle(MODEL_METADATA.filename, { create: false })
          return await fileHandle.getFile()
        } catch {
          // Not in OPFS
        }
      }

      // 2. Try Cache Storage
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cache = await caches.open(CACHE_NAME)
        const cachedResponse = await cache.match(MODEL_METADATA.downloadUrl)
        if (cachedResponse) {
          return await cachedResponse.blob()
        }
      }

      return null
    } catch (err) {
      console.error('[AiModelDownloader] Failed to retrieve local model file:', err)
      return null
    }
  }

  cancelDownload(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  private async markModelDownloaded(): Promise<void> {
    const settings = await db.appSettings.get('global-settings')
    if (settings) {
      await db.appSettings.update('global-settings', {
        localModelDownloaded: true,
        localModelPath: MODEL_METADATA.filename,
        updatedAt: Date.now(),
      })
    }
  }
}

export const aiModelDownloader = new AiModelDownloader()
