import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import pool from '../config/database';

export const requireTenant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    // Buscar tenantId do usuário
    const [users] = await pool.execute(
      'SELECT tenantId FROM users WHERE id = ?',
      [req.userId]
    ) as any[];

    if (users.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    req.tenantId = users[0].tenantId || req.userId; // Fallback para userId se não tiver tenantId

    next();
  } catch (error) {
    console.error('Erro ao verificar tenant:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

