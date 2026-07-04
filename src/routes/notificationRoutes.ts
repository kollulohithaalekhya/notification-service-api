import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { NotificationService } from '../services/NotificationService';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { validateNotificationPayload } from '../middlewares/validateRequest';

const router = Router();

// ── Dependency injection ──────────────────────────────────────
// Compose the dependency graph once here at the route level.
// For a larger application, move this to a dedicated IoC container.
const repository = new NotificationRepository();
const service = new NotificationService(repository);
const controller = new NotificationController(service);

// ── Routes ────────────────────────────────────────────────────
router.post('/', validateNotificationPayload, controller.createNotification);
router.get('/', controller.getNotifications);

export default router;
