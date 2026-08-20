import { NextFunction, Request, Response } from 'express';

export type UserRole = 'hr' | 'manager' | 'employee';

export const requireRole = (allowed: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
  const role = (req.header('x-role') || 'employee') as UserRole;
  if (!allowed.includes(role)) {
    return res.status(403).json({ error: 'Forbidden for role', role });
  }
  return next();
};
