import express, { Request, Response } from 'express';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json());

// ── Health check ──────────────────────────────────────────────
// Used by Docker Compose health checks: curl -f http://localhost:3000/health
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Feature routes ────────────────────────────────────────────
app.use('/api/notifications', notificationRoutes);

// ── 404 fallthrough ───────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────
// Must be the LAST middleware registered — Express identifies error
// handlers by their 4-argument signature.
app.use(errorHandler);

export default app;
