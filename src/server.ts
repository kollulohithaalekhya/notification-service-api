import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env['PORT'] ?? 3000;
const MONGODB_URI =
  process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/notification_service';

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`[Server] Listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received — shutting down gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

start();
