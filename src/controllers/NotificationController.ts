import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/NotificationService';
import { INotificationPayload } from '../models/types';

/**
 * NotificationController
 *
 * Translates HTTP requests into service calls and maps results back to
 * HTTP responses. Contains no business logic — that lives in the service.
 */
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  /**
   * POST /api/notifications
   * Validated by validateNotificationPayload middleware before reaching here.
   */
  createNotification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.body as INotificationPayload;
      const notification = await this.service.processNotification(payload);
      res.status(201).json(notification);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/notifications?page=1&limit=10
   * Defaults to page 1, 10 items per page if params are omitted / invalid.
   */
  getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query['page'] as string, 10) || 1);
      const limit = Math.max(1, parseInt(req.query['limit'] as string, 10) || 10);

      const result = await this.service.getNotifications(page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
