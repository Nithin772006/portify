import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

function getAuthToken(req: AuthRequest): string {
  const cookieToken = req.cookies?.token;
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const token = getAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
