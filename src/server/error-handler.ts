import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line max-params
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = (err as Error)?.message || String(err);
  res.status(500).send(message);
}
