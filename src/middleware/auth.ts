import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../types';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  tenantId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      userRole: UserRole;
      tenantId?: string;
    };

    req.userId = decoded.userId;
    req.userRole = decoded.userRole;
    req.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    next();
  };
};

