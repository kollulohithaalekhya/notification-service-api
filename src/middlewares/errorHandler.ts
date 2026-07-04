import { Request, Response, NextFunction } from 'express';

/**
 * AppError
 *
 * Represents an operational error with a known HTTP status code.
 * Throw this anywhere in the application to produce a clean, predictable
 * JSON error response. Unexpected programming errors fall through to the
 * generic 500 branch which deliberately hides internals from the client.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper prototype chain in compiled ES5 targets
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * errorHandler
 *
 * Express 4-argument error middleware — must be registered LAST in app.ts.
 *
 * Security note: stack traces and raw Mongoose errors are intentionally
 * never sent to the client; they are only written to the server log.
 * Exposing internals is a common attack-surface for reconnaissance.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Log the real error for ops/debugging — never forward it to the client
  console.error('[Unhandled Error]', err.stack ?? err.message);

  res.status(500).json({ error: 'An unexpected error occurred' });
};
