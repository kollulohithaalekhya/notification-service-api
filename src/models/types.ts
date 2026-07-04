// ─────────────────────────────────────────────────────────────
// Domain Types & Interfaces
// Central type definitions used across all application layers
// ─────────────────────────────────────────────────────────────

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
}

export type NotificationStatus = 'pending' | 'sent' | 'failed';

/**
 * The inbound payload shape accepted by POST /api/notifications
 */
export interface INotificationPayload {
  recipient: string;
  type: NotificationType;
  subject?: string; // Required when type === 'email'
  body: string;
}

/**
 * The full persisted entity — extends the payload with DB-managed fields
 */
export interface INotification extends INotificationPayload {
  id: string;
  status: NotificationStatus;
  createdAt: Date;
}

/**
 * Paginated result wrapper returned by GET /api/notifications
 */
export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
