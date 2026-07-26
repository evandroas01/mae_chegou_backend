import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { Notificacao } from '../types';

export class NotificacaoController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const {
        tipo,
        titulo,
        mensagem,
        enviarAgora,
        dataHoraAgendamento,
        destinatarioIds,
      } = req.body;

      const status = enviarAgora ? 'enviada' : 'agendada';

      const result = await pool.query(
        `INSERT INTO notificacoes (
          tipo, titulo, mensagem, "enviarAgora", "dataHoraAgendamento",
          status, "remetenteId", "tenantId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          tipo,
          titulo,
          mensagem,
          enviarAgora,
          dataHoraAgendamento ? new Date(dataHoraAgendamento) : null,
          status,
          req.userId,
          req.tenantId,
        ]
      );

      const notificacaoId = result.rows[0].id.toString();

      // Se for específico, criar registros de destinatários
      if (tipo === 'especifico' && destinatarioIds && destinatarioIds.length > 0) {
        const values: any[] = [];
        const placeholders = destinatarioIds.map((destId: string, i: number) => {
          values.push(notificacaoId, destId);
          return `($${i * 2 + 1}, $${i * 2 + 2})`;
        });
        await pool.query(
          `INSERT INTO notificacao_destinatarios ("notificacaoId", "destinatarioId") VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`,
          values
        );
      } else if (tipo === 'todos') {
        // Buscar todos os responsáveis do tenant
        const responsaveis = await pool.query(
          'SELECT id FROM users WHERE role = \'responsavel\' AND "tenantId" = $1',
          [req.tenantId]
        );

        if (responsaveis.rows.length > 0) {
          const values: any[] = [];
          const placeholders = responsaveis.rows.map((r: any, i: number) => {
            values.push(notificacaoId, r.id.toString());
            return `($${i * 2 + 1}, $${i * 2 + 2})`;
          });
          await pool.query(
            `INSERT INTO notificacao_destinatarios ("notificacaoId", "destinatarioId") VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`,
            values
          );
        }
      }

      const notificacao = await this.findById(notificacaoId, req.tenantId);

      res.status(201).json(notificacao);
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      let query: string;
      const params: any[] = [];

      if (req.userRole === 'responsavel') {
        // Buscar apenas notificações destinadas ao responsável
        query = `
          SELECT n.*, nd.lida, nd."dataLeitura"
          FROM notificacoes n
          INNER JOIN notificacao_destinatarios nd ON n.id = nd."notificacaoId"
          WHERE nd."destinatarioId" = $1 AND n."tenantId" = $2
          ORDER BY n."createdAt" DESC
        `;
        params.push(req.userId, req.tenantId);
      } else {
        query = 'SELECT * FROM notificacoes WHERE "tenantId" = $1 ORDER BY "createdAt" DESC';
        params.push(req.tenantId);
      }

      const result = await pool.query(query, params);

      res.json(result.rows.map((row: any) => this.mapRowToNotificacao(row)));
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async findById(id: string, tenantId: string): Promise<Notificacao | null> {
    const result = await pool.query(
      'SELECT * FROM notificacoes WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToNotificacao(result.rows[0]);
  }

  static async marcarComoLida(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;

      await pool.query(
        `UPDATE notificacao_destinatarios
         SET lida = TRUE, "dataLeitura" = NOW()
         WHERE "notificacaoId" = $1 AND "destinatarioId" = $2`,
        [id, req.userId]
      );

      res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getResponsaveisDisponiveis(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId || req.userRole !== 'motorista') {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }

      const result = await pool.query(
        `SELECT DISTINCT u.id, u.nome, u.cpf, u.telefone, u.email
         FROM users u
         INNER JOIN alunos a ON a."responsavelId" = u.id
         WHERE a."motoristaId" = $1 AND u."tenantId" = $2 AND u.role = 'responsavel'
         ORDER BY u.nome`,
        [req.userId, req.tenantId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar responsáveis:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  private static mapRowToNotificacao(row: any): Notificacao {
    return {
      id: row.id.toString(),
      tipo: row.tipo,
      titulo: row.titulo,
      mensagem: row.mensagem,
      enviarAgora: Boolean(row.enviarAgora),
      dataHoraAgendamento: row.dataHoraAgendamento ? new Date(row.dataHoraAgendamento) : undefined,
      status: row.status,
      templateId: row.templateId ? row.templateId.toString() : undefined,
      gatilhoTipo: row.gatilhoTipo || undefined,
      gatilhoParametros: row.gatilhoParametros || undefined,
      remetenteId: row.remetenteId.toString(),
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
