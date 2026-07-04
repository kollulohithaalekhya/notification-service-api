import { NotificationService } from '../../src/services/NotificationService';
import { NotificationRepository } from '../../src/repositories/NotificationRepository';
import { NotificationType, INotification } from '../../src/models/types';

// Auto-mock all methods on NotificationRepository
jest.mock('../../src/repositories/NotificationRepository');

const MockedRepository = NotificationRepository as jest.MockedClass<typeof NotificationRepository>;

// ─────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────
const makeNotification = (overrides: Partial<INotification> = {}): INotification => ({
  id: 'mock-id-001',
  recipient: 'user@example.com',
  type: NotificationType.EMAIL,
  subject: 'Welcome',
  body: 'Thanks for signing up!',
  status: 'sent',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────
describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepo: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    MockedRepository.mockClear();
    mockRepo = new MockedRepository() as jest.Mocked<NotificationRepository>;
    service = new NotificationService(mockRepo);
  });

  // ── processNotification ──────────────────────────────────────
  describe('processNotification', () => {
    it('processes an EMAIL notification, calls repo.create once with status "sent"', async () => {
      const expected = makeNotification();
      mockRepo.create.mockResolvedValue(expected);

      const payload = {
        recipient: 'user@example.com',
        type: NotificationType.EMAIL,
        subject: 'Welcome',
        body: 'Thanks for signing up!',
      };

      const result = await service.processNotification(payload);

      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ...payload, status: 'sent' }),
      );
      expect(result).toEqual(expected);
    });

    it('processes an SMS notification and persists with status "sent"', async () => {
      const smsNotification = makeNotification({
        type: NotificationType.SMS,
        recipient: '+1234567890',
        subject: undefined,
        body: 'Your OTP is 999999',
      });
      mockRepo.create.mockResolvedValue(smsNotification);

      const payload = {
        recipient: '+1234567890',
        type: NotificationType.SMS,
        body: 'Your OTP is 999999',
      };

      const result = await service.processNotification(payload);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ...payload, status: 'sent' }),
      );
      expect(result.type).toBe(NotificationType.SMS);
    });

    it('persists status "failed" when dispatch simulation throws', async () => {
      const failedNotification = makeNotification({ status: 'failed' });
      mockRepo.create.mockResolvedValue(failedNotification);

      // Force simulateDispatch to throw by injecting a spy
      const consoleSpy = jest.spyOn(console, 'log').mockImplementationOnce(() => {
        throw new Error('Provider unavailable');
      });

      const payload = {
        recipient: 'user@example.com',
        type: NotificationType.EMAIL,
        subject: 'Welcome',
        body: 'Hello!',
      };

      const result = await service.processNotification(payload);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' }),
      );
      expect(result.status).toBe('failed');
      consoleSpy.mockRestore();
    });
  });

  // ── getNotifications ─────────────────────────────────────────
  describe('getNotifications', () => {
    it('returns paginated result with correct metadata', async () => {
      const notifications = [makeNotification(), makeNotification({ id: 'mock-id-002' })];
      mockRepo.findPaginated.mockResolvedValue({ data: notifications, total: 2 });

      const result = await service.getNotifications(1, 10);

      expect(mockRepo.findPaginated).toHaveBeenCalledWith(1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('calculates totalPages correctly for partial last page', async () => {
      mockRepo.findPaginated.mockResolvedValue({
        data: [makeNotification(), makeNotification()],
        total: 11,
      });

      const result = await service.getNotifications(1, 2);

      // 11 items, 2 per page → ceil(11/2) = 6 pages
      expect(result.totalPages).toBe(6);
    });

    it('calculates totalPages = 1 when total equals limit exactly', async () => {
      mockRepo.findPaginated.mockResolvedValue({
        data: [makeNotification()],
        total: 10,
      });

      const result = await service.getNotifications(1, 10);

      expect(result.totalPages).toBe(1);
    });

    it('returns page and limit echoed back in the result', async () => {
      mockRepo.findPaginated.mockResolvedValue({ data: [], total: 0 });

      const result = await service.getNotifications(3, 5);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
    });
  });
});
