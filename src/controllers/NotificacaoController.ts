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

      const [result] = await pool.execute(
        `INSERT INTO notificacoes (
          tipo, titulo, mensagem, enviarAgora, dataHoraAgendamento,
          status, remetenteId, tenantId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ) as any;

      const notificacaoId = result.insertId.toString();

      // Se for específico, criar registros de destinatários
      if (tipo === 'especifico' && destinatarioIds && destinatarioIds.length > 0) {
        const values = destinatarioIds.map((destId: string) => [notificacaoId, destId]);
        const placeholders = values.map(() => '(?, ?)').join(', ');

        await pool.execute(
          `INSERT INTO notificacao_destinatarios (notificacaoId, destinatarioId)
           VALUES ${placeholders}`,
          values.flat()
        );
      } else if (tipo === 'todos') {
        // Buscar todos os responsáveis do tenant
        const [responsaveis] = await pool.execute(
          'SELECT id FROM users WHERE role = "responsavel" AND tenantId = ?',
          [req.tenantId]
        ) as any[];

        if (responsaveis.length > 0) {
          const values = responsaveis.map((r: any) => [notificacaoId, r.id.toString()]);
          const placeholders = values.map(() => '(?, ?)').join(', ');

          await pool.execute(
            `INSERT INTO notificacao_destinatarios (notificacaoId, destinatarioId)
             VALUES ${placeholders}`,
            values.flat()
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

      let query = 'SELECT * FROM notificacoes WHERE tenantId = ?';
      const params: any[] = [req.tenantId];

      if (req.userRole === 'responsavel') {
        // Buscar apenas notificações destinadas ao responsável
        query = `
          SELECT n.*, nd.lida, nd.dataLeitura
          FROM notificacoes n
          INNER JOIN notificacao_destinatarios nd ON n.id = nd.notificacaoId
          WHERE nd.destinatarioId = ? AND n.tenantId = ?
          ORDER BY n.createdAt DESC
        `;
        params.unshift(req.userId);
      } else {
        query += ' ORDER BY createdAt DESC';
      }

      const [rows] = await pool.execute(query, params) as any[];

      res.json(rows.map((row: any) => this.mapRowToNotificacao(row)));
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async findById(id: string, tenantId: string): Promise<Notificacao | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM notificacoes WHERE id = ? AND tenantId = ?',
      [id, tenantId]
    ) as any[];

    if (rows.length === 0) return null;

    return this.mapRowToNotificacao(rows[0]);
  }

  static async marcarComoLida(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;

      await pool.execute(
        `UPDATE notificacao_destinatarios
         SET lida = true, dataLeitura = NOW()
         WHERE notificacaoId = ? AND destinatarioId = ?`,
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

      // Buscar responsáveis dos alunos do motorista
      const [rows] = await pool.execute(
        `SELECT DISTINCT u.id, u.nome, u.cpf, u.telefone, u.email
         FROM users u
         INNER JOIN alunos a ON a.responsavelId = u.id
         WHERE a.motoristaId = ? AND u.tenantId = ? AND u.role = 'responsavel'
         ORDER BY u.nome`,
        [req.userId, req.tenantId]
      ) as any[];

      res.json(rows);
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

