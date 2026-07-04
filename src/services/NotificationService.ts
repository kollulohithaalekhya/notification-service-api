import { NotificationRepository } from '../repositories/NotificationRepository';
import {
  INotification,
  INotificationPayload,
  IPaginatedResult,
  NotificationType,
  NotificationStatus,
} from '../models/types';

/**
 * NotificationService
 *
 * Owns all business logic: dispatch simulation, status resolution, and
 * pagination assembly. Consumes the repository as an injected dependency,
 * making it trivially mockable in unit tests.
 */
export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  /**
   * Simulate sending the notification, then persist the outcome.
   * In a real system, replace simulateDispatch() with a provider call
   * (e.g., AWS SES for email, Twilio for SMS).
   */
  async processNotification(payload: INotificationPayload): Promise<INotification> {
    let status: NotificationStatus = 'sent';

    try {
      await this.simulateDispatch(payload);
    } catch (err) {
      console.error('[NotificationService] Dispatch simulation failed:', err);
      status = 'failed';
    }

    return this.repository.create({ ...payload, status });
  }

  /**
   * Return a paginated, metadata-enriched list of notifications.
   */
  async getNotifications(
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<INotification>> {
    const { data, total } = await this.repository.findPaginated(page, limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Private helpers ──────────────────────────────────────────

  /**
   * Simulates the outbound dispatch call.
   * Structured as a no-op async function so it can be replaced with a
   * real provider call without any change to the surrounding logic.
   */
  private async simulateDispatch(payload: INotificationPayload): Promise<void> {
    switch (payload.type) {
      case NotificationType.EMAIL:
        console.log(`[Dispatch] Sending email via SES to: ${payload.recipient}`);
        break;
      case NotificationType.SMS:
        console.log(`[Dispatch] Sending SMS via SNS to: ${payload.recipient}`);
        break;
      default:
        // TypeScript exhaustiveness check — payload.type has type 'never' here
        throw new Error(`Unsupported notification type: ${payload.type as string}`);
    }
    // Simulate async I/O (network call to provider)
    await Promise.resolve();
  }
}
