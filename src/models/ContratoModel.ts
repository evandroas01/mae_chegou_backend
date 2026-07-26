import pool from '../config/database';
import { Contrato, ContratoLog } from '../types';

export class ContratoModel {
  static async create(contrato: Omit<Contrato, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO contratos (
        numero, "responsavelId", periodo, valor, vencimento,
        "statusAssinatura", "statusPagamento", "periodoAtraso",
        clausulas, "arquivoUrl", "dataInicio", "dataFim",
        "dataEnvio", "dataAssinatura", "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        contrato.numero,
        contrato.responsavelId,
        contrato.periodo,
        contrato.valor,
        contrato.vencimento,
        contrato.statusAssinatura,
        contrato.statusPagamento,
        contrato.periodoAtraso || null,
        contrato.clausulas || null,
        contrato.arquivoUrl || null,
        contrato.dataInicio,
        contrato.dataFim || null,
        contrato.dataEnvio || null,
        contrato.dataAssinatura || null,
        contrato.tenantId,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Contrato | null> {
    const result = await pool.query(
      'SELECT * FROM contratos WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToContrato(result.rows[0]);
  }

  static async findAll(tenantId: string, filters?: {
    responsavelId?: string;
    statusAssinatura?: string;
    statusPagamento?: string;
  }): Promise<Contrato[]> {
    let query = 'SELECT * FROM contratos WHERE "tenantId" = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.responsavelId) {
      query += ` AND "responsavelId" = $${paramIndex++}`;
      params.push(filters.responsavelId);
    }
    if (filters?.statusAssinatura) {
      query += ` AND "statusAssinatura" = $${paramIndex++}`;
      params.push(filters.statusAssinatura);
    }
    if (filters?.statusPagamento) {
      query += ` AND "statusPagamento" = $${paramIndex++}`;
      params.push(filters.statusPagamento);
    }

    query += ' ORDER BY "createdAt" DESC';

    const result = await pool.query(query, params);

    return result.rows.map((row: any) => this.mapRowToContrato(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Contrato>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const camelCols = new Set([
      'responsavelId','statusAssinatura','statusPagamento','periodoAtraso',
      'arquivoUrl','dataInicio','dataFim','dataEnvio','dataAssinatura','tenantId',
      'createdAt','updatedAt',
    ]);
    const skipFields = new Set(['id', 'createdAt', 'updatedAt', 'tenantId']);

    Object.keys(updates).forEach((key) => {
      if (!skipFields.has(key)) {
        const col = camelCols.has(key) ? `"${key}"` : key;
        fields.push(`${col} = $${paramIndex++}`);
        values.push((updates as any)[key]);
      }
    });

    if (fields.length === 0) return;

    values.push(id, tenantId);

    await pool.query(
      `UPDATE contratos SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND "tenantId" = $${paramIndex}`,
      values
    );
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    await pool.query(
      'DELETE FROM contratos WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );
  }

  static async addAluno(contratoId: string, alunoId: string): Promise<void> {
    await pool.query(
      'INSERT INTO contrato_alunos ("contratoId", "alunoId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [contratoId, alunoId]
    );
  }

  static async getAlunos(contratoId: string): Promise<string[]> {
    const result = await pool.query(
      'SELECT "alunoId" FROM contrato_alunos WHERE "contratoId" = $1',
      [contratoId]
    );

    return result.rows.map((row: any) => row.alunoId.toString());
  }

  static async addLog(log: Omit<ContratoLog, 'id' | 'createdAt'>): Promise<void> {
    await pool.query(
      'INSERT INTO contrato_logs ("contratoId", acao, data, observacoes) VALUES ($1, $2, $3, $4)',
      [log.contratoId, log.acao, log.data, log.observacoes || null]
    );
  }

  static async getLogs(contratoId: string): Promise<ContratoLog[]> {
    const result = await pool.query(
      'SELECT * FROM contrato_logs WHERE "contratoId" = $1 ORDER BY data DESC',
      [contratoId]
    );

    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      contratoId: row.contratoId.toString(),
      acao: row.acao,
      data: row.data,
      observacoes: row.observacoes,
      createdAt: row.createdAt,
    }));
  }

  private static mapRowToContrato(row: any): Contrato {
    return {
      id: row.id.toString(),
      numero: row.numero,
      responsavelId: row.responsavelId.toString(),
      periodo: row.periodo,
      valor: parseFloat(row.valor),
      vencimento: parseInt(row.vencimento),
      statusAssinatura: row.statusAssinatura,
      statusPagamento: row.statusPagamento,
      periodoAtraso: row.periodoAtraso ? parseInt(row.periodoAtraso) : undefined,
      clausulas: row.clausulas || undefined,
      arquivoUrl: row.arquivoUrl || undefined,
      dataInicio: row.dataInicio,
      dataFim: row.dataFim || undefined,
      dataEnvio: row.dataEnvio || undefined,
      dataAssinatura: row.dataAssinatura || undefined,
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
