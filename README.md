# Notification Service API

A production-grade **Notification Service** built with Node.js, TypeScript, Express, MongoDB, Jest, and Docker.

## Architecture

```
notification-service/
├── src/
│   ├── app.ts                        # Express app setup
│   ├── server.ts                     # Process entry point / DB bootstrap
│   ├── controllers/
│   │   └── NotificationController.ts # HTTP ↔ Service translation
│   ├── services/
│   │   └── NotificationService.ts    # Business logic & dispatch simulation
│   ├── repositories/
│   │   └── NotificationRepository.ts # All MongoDB interactions
│   ├── models/
│   │   ├── types.ts                  # Shared TypeScript interfaces & enums
│   │   └── Notification.ts           # Mongoose schema & model
│   ├── middlewares/
│   │   ├── validateRequest.ts        # Input validation (400 guard)
│   │   └── errorHandler.ts           # Centralized error handling
│   └── routes/
│       └── notificationRoutes.ts     # Route → middleware → controller wiring
├── tests/
│   ├── unit/
│   │   └── NotificationService.test.ts
│   └── integration/
│       └── notification.test.ts
├── Dockerfile                        # Multi-stage build
├── docker-compose.yml                # API + MongoDB orchestration
├── tsconfig.json                     # Strict TypeScript config
├── jest.config.ts
└── .env.example
```

The application follows a strict **Controller → Service → Repository** layered pattern.

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit MONGODB_URI to point to your local MongoDB

# 3. Start with hot-reload
npm run dev
```

### Docker Compose (recommended)

```bash
# Build and start both containers with health-checked ordered startup
docker-compose up --build

# API available at: http://localhost:3000
```

## API Reference

### POST /api/notifications
Create and dispatch a notification.

**Request body:**
```json
{
  "recipient": "user@example.com",
  "type": "email",
  "subject": "Welcome!",
  "body": "Thanks for signing up."
}
```
- `type` must be `"email"` or `"sms"`
- `subject` is required when `type` is `"email"`

**Response (201):**
```json
{
  "id": "...",
  "recipient": "user@example.com",
  "type": "email",
  "subject": "Welcome!",
  "body": "Thanks for signing up.",
  "status": "sent",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/notifications?page=1&limit=10
Retrieve paginated notifications, ordered newest-first.

**Response (200):**
```json
{
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### GET /health
Health check used by Docker and load balancers.

## Testing

```bash
# Run all tests
npm test

# Run with coverage report (requires ≥80% across all metrics)
npm run test:coverage
```

Tests use **mongodb-memory-server** — no external database needed.

## Build

```bash
npm run build   # Compiles TypeScript → dist/
npm start       # Runs the compiled production bundle
```
"# notification-service-api" 
