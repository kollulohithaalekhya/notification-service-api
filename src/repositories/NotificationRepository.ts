import { NotificationModel } from '../models/Notification';
import { INotification } from '../models/types';

/**
 * NotificationRepository
 *
 * Acts as the sole gateway between the application and MongoDB.
 * All Mongoose imports live here; no other layer should import from mongoose directly.
 * Returning plain INotification objects (not Mongoose Documents) keeps the
 * service / controller layers free of ORM concerns.
 */
export class NotificationRepository {
  /**
   * Persist a new notification document.
   */
  async create(payload: Partial<INotification>): Promise<INotification> {
    const doc = await NotificationModel.create(payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.toEntity(doc.toObject({ virtuals: true }) as unknown as Record<string, unknown>);
  }

  /**
   * Retrieve a time-ordered, paginated slice of notifications.
   * Runs both queries in parallel for efficiency.
   */
  async findPaginated(
    page: number,
    limit: number,
  ): Promise<{ data: INotification[]; total: number }> {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      NotificationModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      NotificationModel.countDocuments(),
    ]);

    return {
      data: docs.map((doc) => this.toEntity(doc)),
      total,
    };
  }

  // ── Private helpers ──────────────────────────────────────────

  /**
   * Maps a raw Mongoose lean/toObject result to the clean INotification entity.
   * Centralising this mapping means the schema can change without touching
   * any other layer.
   */
  private toEntity(raw: Record<string, unknown>): INotification {
    return {
      id: String(raw._id ?? raw.id),
      recipient: raw.recipient as string,
      type: raw.type as INotification['type'],
      subject: raw.subject as string | undefined,
      body: raw.body as string,
      status: raw.status as INotification['status'],
      createdAt: raw.createdAt as Date,
    };
  }
}
