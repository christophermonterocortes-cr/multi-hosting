import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.stack || err);

  res.status(statusCode).json({
    error: message,
    ...(config.env === 'development' ? { stack: err.stack } : {})
  });
}
