import type {
  ApiResponse,
  ApiSuccess,
  ApiError,
  SyncPushPayload,
  SyncPushResult,
  SyncPullPayload,
  SyncPullData,
} from '@/types/api'

export class ApiClientError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId?: string
  readonly details?: unknown

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, requestId?: string, details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.requestId = requestId
    this.details = details
  }
}

export class ApiClient {
  private baseUrl: string = 'http://localhost:4000'
  private authToken: string | null = null
  private refreshToken: string | null = null

  setBaseUrl(url: string): void {
    if (url && url.trim().length > 0) {
      this.baseUrl = url.trim().replace(/\/$/, '')
    }
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  setAuthTokens(tokens: { accessToken: string; refreshToken?: string }): void {
    this.authToken = tokens.accessToken
    if (tokens.refreshToken) {
      this.refreshToken = tokens.refreshToken
    }
  }

  clearAuthTokens(): void {
    this.authToken = null
    this.refreshToken = null
  }

  getAccessToken(): string | null {
    return this.authToken
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<{ data: T; requestId: string }> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    const requestId = crypto.randomUUID()

    const headers = new Headers(options.headers || {})
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('X-Request-Id', requestId)

    if (this.authToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.authToken}`)
    }

    let res: Response
    try {
      res = await fetch(url, {
        ...options,
        headers,
      })
    } catch (networkError) {
      const msg = networkError instanceof Error ? networkError.message : 'Network connection failed'
      throw new ApiClientError(
        `Unable to reach backend server at ${this.baseUrl}: ${msg}`,
        'NETWORK_ERROR',
        0,
        requestId
      )
    }

    const responseRequestId = res.headers.get('x-request-id') || requestId

    let json: ApiResponse<T>
    try {
      json = (await res.json()) as ApiResponse<T>
    } catch {
      throw new ApiClientError(
        `Invalid non-JSON response from ${path} (HTTP ${res.status})`,
        'INTERNAL_ERROR',
        res.status,
        responseRequestId
      )
    }

    if (json.status === 'error') {
      const err = json as ApiError
      throw new ApiClientError(
        err.error.message || 'Request failed',
        err.error.code || 'INTERNAL_ERROR',
        res.status,
        err.requestId || responseRequestId,
        err.error.details
      )
    }

    const success = json as ApiSuccess<T>
    return {
      data: success.data,
      requestId: success.requestId || responseRequestId,
    }
  }

  async sendOtp(email: string): Promise<{ success: boolean; message: string; testOtp?: string }> {
    const result = await this.request<{ success: boolean; message: string; testOtp?: string }>(
      '/api/auth/otp/send',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    )
    return result.data
  }

  async verifyOtp(
    email: string,
    otp: string
  ): Promise<{
    success: boolean
    isNewUser: boolean
    accessToken?: string
    refreshToken?: string
    expiresIn?: number
    user?: any
    organization?: any
  }> {
    const result = await this.request<{
      success: boolean
      isNewUser: boolean
      accessToken?: string
      refreshToken?: string
      expiresIn?: number
      user?: any
      organization?: any
    }>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    })
    return result.data
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const result = await this.request<{
      accessToken: string
      refreshToken: string
      expiresIn: number
    }>('/api/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
    return result.data
  }

  async completeOnboarding(data: {
    email: string
    fullName: string
    companyName: string
    country?: string
    currency?: string
    staffCount: string
    monthlyTransactionVolume: string
    monthlyRevenue: string
    aiModelMode: string
  }): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    user: any
    organization: any
  }> {
    const result = await this.request<{
      accessToken: string
      refreshToken: string
      expiresIn: number
      user: any
      organization: any
    }>('/api/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return result.data
  }

  async checkModelStatus(filename: string): Promise<{ exists: boolean; filename: string; path?: string }> {
    const result = await this.request<{ exists: boolean; filename: string; path?: string }>(
      `/api/ai/model/check?filename=${encodeURIComponent(filename)}`,
      { method: 'GET' }
    )
    return result.data
  }

  async pushSync(payload: SyncPushPayload): Promise<SyncPushResult> {
    const result = await this.request<SyncPushResult>('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return result.data
  }

  async pullSync(payload: SyncPullPayload): Promise<SyncPullData> {
    const result = await this.request<SyncPullData>('/api/sync/pull', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return result.data
  }

  async listDocumentComments(documentId: string, orgId: string): Promise<unknown[]> {
    const result = await this.request<unknown[]>(
      `/api/documents/${encodeURIComponent(documentId)}/comments?orgId=${encodeURIComponent(orgId)}`,
      { method: 'GET' }
    )
    return result.data
  }

  async createDocumentComment(payload: {
    id?: string
    documentId: string
    orgId: string
    parentCommentId?: string | null
    userId: string
    userName: string
    userRole: string
    comment: string
    highlightedText?: string | null
  }): Promise<unknown> {
    const result = await this.request<unknown>(
      `/api/documents/${encodeURIComponent(payload.documentId)}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
    return result.data
  }

  async uploadAttachment(
    file: File | Blob,
    key: string
  ): Promise<{ key: string; presignedUrl: string }> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      throw new ApiClientError(
        `Unsupported media type "${file.type}". Allowed types: ${allowedTypes.join(', ')}`,
        'VALIDATION_ERROR',
        400
      )
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('key', key)

    const result = await this.request<{ key: string; presignedUrl: string }>(
      '/api/attachments/upload',
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': key,
        },
        body: formData,
      }
    )
    return result.data
  }

  async createStaffInvitation(payload: {
    orgId: string
    email: string
    fullName: string
    role: 'admin' | 'manager' | 'cashier' | 'pharmacist' | 'auditor'
    department?: string
    invitedById: string
    invitedByName: string
  }): Promise<unknown> {
    const result = await this.request<unknown>('/api/org/staff/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return result.data
  }

  async listStaffInvitations(orgId: string): Promise<unknown[]> {
    const result = await this.request<unknown[]>(
      `/api/org/staff/invitations?orgId=${encodeURIComponent(orgId)}`,
      { method: 'GET' }
    )
    return result.data
  }

  async acceptStaffInvitation(payload: {
    token: string
    userId: string
    fullName: string
  }): Promise<{ orgId: string; role: string; email: string; fullName: string }> {
    const result = await this.request<{ orgId: string; role: string; email: string; fullName: string }>(
      '/api/org/staff/accept-invite',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
    return result.data
  }

  async revokeStaffInvitation(payload: {
    invitationId: string
    orgId: string
    revokedById?: string
    revokedByName?: string
  }): Promise<{ success: boolean }> {
    const result = await this.request<{ success: boolean }>('/api/org/staff/revoke-invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return result.data
  }

  async recordAuditLog(payload: {
    orgId?: string | null
    userId: string
    userName: string
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'OVERRIDE' | 'INVITE' | 'LOGIN' | 'REVOKE'
    entityType: string
    entityId: string
    details: Record<string, unknown>
  }): Promise<unknown> {
    const result = await this.request<unknown>('/api/audit-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return result.data
  }

  async recordAuditBatch(payload: {
    orgId: string
    logs: {
      id: string
      userId: string
      userName: string
      action: 'CREATE' | 'UPDATE' | 'DELETE' | 'OVERRIDE' | 'INVITE' | 'LOGIN' | 'REVOKE'
      entityType: string
      entityId: string
      details: Record<string, unknown>
      createdAt: number
    }[]
  }): Promise<{ inserted: number }> {
    const result = await this.request<{ inserted: number }>('/api/audit-logs/batch', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return result.data
  }

  async queryAuditLogs(params: {
    orgId: string
    action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'OVERRIDE' | 'INVITE' | 'LOGIN' | 'REVOKE'
    startTime?: number
    endTime?: number
    limit?: number
    offset?: number
  }): Promise<{ logs: unknown[]; total: number }> {
    const query = new URLSearchParams({ orgId: params.orgId })
    if (params.action) query.set('action', params.action)
    if (params.startTime !== undefined) query.set('startTime', String(params.startTime))
    if (params.endTime !== undefined) query.set('endTime', String(params.endTime))
    if (params.limit !== undefined) query.set('limit', String(params.limit))
    if (params.offset !== undefined) query.set('offset', String(params.offset))

    const result = await this.request<{ logs: unknown[]; total: number }>(
      `/api/audit-logs?${query.toString()}`,
      { method: 'GET' }
    )
    return result.data
  }
}

export const apiClient = new ApiClient()
