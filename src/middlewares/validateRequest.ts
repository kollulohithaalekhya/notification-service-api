import { Request, Response, NextFunction } from 'express';
import { NotificationType } from '../models/types';

interface ValidationError {
  field: string;
  message: string;
}

/**
 * validateNotificationPayload
 *
 * Guards the POST /api/notifications route. Validates each field explicitly
 * so the service layer never receives malformed data. Returns a structured
 * 400 response listing every error so clients know exactly what to fix.
 */
export const validateNotificationPayload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors: ValidationError[] = [];
  const { recipient, type, subject, body } = req.body as Record<string, unknown>;

  // ── recipient ─────────────────────────────────────────────────
  if (!recipient || typeof recipient !== 'string' || recipient.trim() === '') {
    errors.push({
      field: 'recipient',
      message: 'recipient is required and must be a non-empty string',
    });
  }

  // ── type ──────────────────────────────────────────────────────
  const validTypes = Object.values(NotificationType) as string[];
  if (!type) {
    errors.push({ field: 'type', message: 'type is required' });
  } else if (typeof type !== 'string' || !validTypes.includes(type)) {
    errors.push({
      field: 'type',
      message: `type must be one of: ${validTypes.join(', ')}`,
    });
  }

  // ── body ──────────────────────────────────────────────────────
  if (!body || typeof body !== 'string' || body.trim() === '') {
    errors.push({
      field: 'body',
      message: 'body is required and must be a non-empty string',
    });
  }

  // ── subject (conditional — required for email) ────────────────
  if (type === NotificationType.EMAIL) {
    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
      errors.push({
        field: 'subject',
        message: 'subject is required when type is "email"',
      });
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  next();
};
