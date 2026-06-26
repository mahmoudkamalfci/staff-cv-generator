import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  err.statusCode = err.statusCode || 500;

  // Handle Prisma Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Unique constraint violation', details: err.meta });
      return;
    }
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
