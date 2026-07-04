/**
 * Integration tests — HTTP layer
 *
 * Exercises the complete Express pipeline:
 *   HTTP request → routing → validation → controller → service → repository
 *
 * The Mongoose model is mocked so no real database connection is required.
 */

import request from 'supertest';
import app from '../../src/app';
import { NotificationModel } from '../../src/models/Notification';
import { Types } from 'mongoose';

jest.mock('../../src/models/Notification');

const MockModel = NotificationModel as jest.Mocked<typeof NotificationModel>;

// ─────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────
const makeDoc = (overrides: Record<string, unknown> = {}) => {
  const id = new Types.ObjectId();
  const base: Record<string, unknown> = {
    _id: id,
    id: id.toString(),
    recipient: 'user@example.com',
    type: 'email',
    subject: 'Welcome',
    body: 'Hello!',
    status: 'sent',
    createdAt: new Date('2024-06-01T10:00:00Z'),
    updatedAt: new Date('2024-06-01T10:00:00Z'),
    ...overrides,
  };
  base.toObject = (_opts?: { virtuals?: boolean }) => ({ ...base });
  return base;
};

const makeLeanDoc = (i: number) => ({
  _id: new Types.ObjectId(),
  id: new Types.ObjectId().toString(),
  recipient: `user${i}@example.com`,
  type: 'sms',
  body: `Message ${i}`,
  status: 'sent',
  createdAt: new Date(Date.now() - i * 1000),
  updatedAt: new Date(Date.now() - i * 1000),
});

const mockFind = (docs: object[], total: number) => {
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(docs),
  };
  (MockModel.find as jest.Mock) = jest.fn().mockReturnValue(query);
  (MockModel.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(total);
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────
// POST /api/notifications
// ─────────────────────────────────────────────────────────────
describe('POST /api/notifications', () => {
  describe('Happy paths', () => {
    it('creates an email notification → 201 with id and status "sent"', async () => {
      (MockModel.create as jest.Mock) = jest.fn().mockResolvedValue(makeDoc());

      const res = await request(app)
        .post('/api/notifications')
        .set('Content-Type', 'application/json')
        .send({ recipient: 'user@example.com', type: 'email', subject: 'Welcome', body: 'Hello!' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('sent');
      expect(res.body.recipient).toBe('user@example.com');
      expect(res.body.type).toBe('email');
    });

    it('creates an SMS notification → 201', async () => {
      (MockModel.create as jest.Mock) = jest.fn().mockResolvedValue(
        makeDoc({ type: 'sms', recipient: '+1234567890', subject: undefined }),
      );

      const res = await request(app)
        .post('/api/notifications')
        .send({ recipient: '+1234567890', type: 'sms', body: 'Your OTP is 123456' });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('sms');
    });

    it('calls Model.create exactly once with correct payload', async () => {
      (MockModel.create as jest.Mock) = jest.fn().mockResolvedValue(makeDoc({ type: 'sms' }));

      await request(app)
        .post('/api/notifications')
        .send({ recipient: 'user@example.com', type: 'sms', body: 'Hi' });

      expect(MockModel.create).toHaveBeenCalledTimes(1);
      expect(MockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ recipient: 'user@example.com', type: 'sms', body: 'Hi' }),
      );
    });
  });

  describe('Validation failures → 400', () => {
    it('returns 400 when body field is missing', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .send({ recipient: 'user@example.com', type: 'email', subject: 'Hi' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'body' })]),
      );
    });

    it('returns 400 when recipient is missing', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .send({ type: 'sms', body: 'Hello!' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'recipient' })]),
      );
    });

    it('returns 400 when type is invalid', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .send({ recipient: 'user@example.com', type: 'push', body: 'Hello!' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'type' })]),
      );
    });

    it('returns 400 when email is missing subject', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .send({ recipient: 'user@example.com', type: 'email', body: 'Hello!' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'subject' })]),
      );
    });

    it('reports multiple errors for fully empty payload', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('does NOT call Model.create when validation fails', async () => {
      (MockModel.create as jest.Mock) = jest.fn();

      await request(app)
        .post('/api/notifications')
        .send({ type: 'email', body: 'No recipient' });

      expect(MockModel.create).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/notifications
// ─────────────────────────────────────────────────────────────
describe('GET /api/notifications', () => {
  it('returns 200 with data array and pagination metadata', async () => {
    const docs = Array.from({ length: 3 }, (_, i) => makeLeanDoc(i));
    mockFind(docs, 3);

    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total', 3);
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
  });

  it('respects page=1&limit=2 query parameters', async () => {
    mockFind([makeLeanDoc(0), makeLeanDoc(1)], 5);

    const res = await request(app).get('/api/notifications?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });

  it('returns the correct page number in the response', async () => {
    mockFind([makeLeanDoc(0)], 10);

    const res = await request(app).get('/api/notifications?page=3&limit=1');

    expect(res.body.page).toBe(3);
  });

  it('returns empty data array when no notifications exist', async () => {
    mockFind([], 0);

    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────
describe('Error handling', () => {
  it('returns 404 for an unknown GET route', async () => {
    const res = await request(app).get('/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    // Stack traces must never leak to the client
    expect(JSON.stringify(res.body)).not.toContain('at Object');
  });

  it('returns 404 for an unknown POST route', async () => {
    const res = await request(app).post('/api/unknown');
    expect(res.status).toBe(404);
  });

  it('returns 500 and hides internals when service throws unexpectedly', async () => {
    (MockModel.create as jest.Mock) = jest.fn().mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app)
      .post('/api/notifications')
      .send({ recipient: 'user@example.com', type: 'sms', body: 'Hello' });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'An unexpected error occurred');
    expect(res.body.error).not.toContain('DB connection lost');
  });
});

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
