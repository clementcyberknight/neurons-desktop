import { db } from '@/db/localDb'
import type { AuditAction, AuditLogEntry } from '@/types/database'

export async function trackActivity(
  action: AuditAction,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const activeUserId = localStorage.getItem('neurons_active_user_id')
    let userId = 'system-local'
    let userName = 'Local User'
    let orgId: string | null = null

    if (activeUserId) {
      const profile = await db.userProfile.get(activeUserId)
      if (profile) {
        userId = profile.id
        userName = profile.fullName || profile.email || 'Local User'
        orgId = (profile as unknown as { orgId?: string }).orgId || null
      }
    }

    const entry: AuditLogEntry = {
      id: `audit-${crypto.randomUUID()}`,
      orgId,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: 0,
    }

    await db.auditLogs.add(entry)
  } catch (err) {
    console.warn('Failed to record activity audit log locally:', err)
  }
}
