import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../config/database';
import { Manutencao } from '../types';
import { VeiculoModel } from '../models/VeiculoModel';

export class ManutencaoController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const {
        veiculoId,
        dataAgendada,
        tipo,
        descricao,
        quilometragem,
        custo,
        repetirTipo,
        repetirIntervalo,
      } = req.body;

      // Buscar veículo do motorista
      const veiculos = await pool.query(
        'SELECT id FROM veiculos WHERE id = $1 AND "motoristaId" = $2 AND "tenantId" = $3',
        [veiculoId, req.userId, req.tenantId]
      );

      if (veiculos.rows.length === 0) {
        res.status(404).json({ error: 'Veículo não encontrado' });
        return;
      }

      const status = dataAgendada ? 'agendada' : 'realizada';

      const result = await pool.query(
        `INSERT INTO manutencoes (
          "veiculoId", "dataAgendada", "dataRealizada", tipo, descricao,
          custo, quilometragem, status, "repetirTipo", "repetirIntervalo", "tenantId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          veiculoId,
          dataAgendada ? new Date(dataAgendada) : null,
          !dataAgendada ? new Date() : null,
          tipo,
          descricao,
          custo || 0,
          quilometragem,
          status,
          repetirTipo || null,
          repetirIntervalo || null,
          req.tenantId,
        ]
      );

      const manutencao = await this.findById(result.rows[0].id.toString(), req.tenantId);

      res.status(201).json(manutencao);
    } catch (error) {
      console.error('Erro ao criar manutenção:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { status, veiculoId } = req.query;

      let query = `
        SELECT m.*, v.placa, v.modelo
        FROM manutencoes m
        LEFT JOIN veiculos v ON m."veiculoId" = v.id
        WHERE m."tenantId" = $1
      `;
      const params: any[] = [req.tenantId];
      let paramIndex = 2;

      if (req.userRole === 'motorista') {
        query += ` AND v."motoristaId" = $${paramIndex++}`;
        params.push(req.userId);
      }

      if (veiculoId) {
        query += ` AND m."veiculoId" = $${paramIndex++}`;
        params.push(veiculoId);
      }

      if (status) {
        query += ` AND m.status = $${paramIndex++}`;
        params.push(status);
      }

      query += ' ORDER BY m."createdAt" DESC';

      const result = await pool.query(query, params);

      res.json(result.rows.map((row: any) => this.mapRowToManutencao(row)));
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async findById(id: string, tenantId: string): Promise<Manutencao | null> {
    const result = await pool.query(
      'SELECT * FROM manutencoes WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToManutencao(result.rows[0]);
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.dataAgendada !== undefined) {
        fields.push(`"dataAgendada" = $${paramIndex++}`);
        values.push(updates.dataAgendada ? new Date(updates.dataAgendada) : null);
      }
      if (updates.dataRealizada !== undefined) {
        fields.push(`"dataRealizada" = $${paramIndex++}`);
        values.push(updates.dataRealizada ? new Date(updates.dataRealizada) : null);
      }
      if (updates.tipo) {
        fields.push(`tipo = $${paramIndex++}`);
        values.push(updates.tipo);
      }
      if (updates.descricao) {
        fields.push(`descricao = $${paramIndex++}`);
        values.push(updates.descricao);
      }
      if (updates.custo !== undefined) {
        fields.push(`custo = $${paramIndex++}`);
        values.push(updates.custo);
      }
      if (updates.quilometragem !== undefined) {
        fields.push(`quilometragem = $${paramIndex++}`);
        values.push(updates.quilometragem);
      }
      if (updates.status) {
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }
      if (updates.repetirTipo !== undefined) {
        fields.push(`"repetirTipo" = $${paramIndex++}`);
        values.push(updates.repetirTipo);
      }
      if (updates.repetirIntervalo !== undefined) {
        fields.push(`"repetirIntervalo" = $${paramIndex++}`);
        values.push(updates.repetirIntervalo);
      }

      if (fields.length === 0) {
        res.status(400).json({ error: 'Nenhum campo para atualizar' });
        return;
      }

      values.push(id, req.tenantId);

      await pool.query(
        `UPDATE manutencoes SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND "tenantId" = $${paramIndex}`,
        values
      );

      const manutencao = await this.findById(id, req.tenantId);

      res.json(manutencao);
    } catch (error) {
      console.error('Erro ao atualizar manutenção:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  private static mapRowToManutencao(row: any): Manutencao {
    return {
      id: row.id?.toString(),
      veiculoId: row.veiculoId?.toString(),
      dataAgendada: row.dataAgendada ? new Date(row.dataAgendada) : undefined,
      dataRealizada: row.dataRealizada ? new Date(row.dataRealizada) : undefined,
      tipo: row.tipo,
      descricao: row.descricao,
      custo: parseFloat(row.custo),
      quilometragem: parseInt(row.quilometragem),
      status: row.status,
      repetirTipo: row.repetirTipo || undefined,
      repetirIntervalo: row.repetirIntervalo ? parseInt(row.repetirIntervalo) : undefined,
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  static async getVeiculos(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId || !req.userId) {
        res.status(400).json({ error: 'Tenant ID ou User ID não encontrado' });
        return;
      }

      if (req.userRole !== 'motorista') {
        res.status(403).json({ error: 'Apenas motoristas podem acessar esta rota' });
        return;
      }

      const veiculos = await VeiculoModel.findByMotorista(req.userId, req.tenantId);
      res.json(veiculos);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
