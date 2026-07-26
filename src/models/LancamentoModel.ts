import pool from '../config/database';
import { Lancamento } from '../types';

export class LancamentoModel {
  static async create(lancamento: Omit<Lancamento, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO lancamentos (
        tipo, categoria, valor, data, "dataVencimento", "dataPagamento",
        descricao, status, "vinculadoAlunoId", "vinculadoContratoId",
        "recorrenciaTipo", "recorrenciaMeses", "recorrenciaDataFim", "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        lancamento.tipo,
        lancamento.categoria,
        lancamento.valor,
        lancamento.data,
        lancamento.dataVencimento || null,
        lancamento.dataPagamento || null,
        lancamento.descricao,
        lancamento.status,
        lancamento.vinculadoAlunoId || null,
        lancamento.vinculadoContratoId || null,
        lancamento.recorrenciaTipo || null,
        lancamento.recorrenciaMeses || null,
        lancamento.recorrenciaDataFim || null,
        lancamento.tenantId,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Lancamento | null> {
    const result = await pool.query(
      'SELECT * FROM lancamentos WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToLancamento(result.rows[0]);
  }

  static async findAll(tenantId: string, filters?: {
    tipo?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Lancamento[]> {
    let query = 'SELECT * FROM lancamentos WHERE "tenantId" = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.tipo) {
      query += ` AND tipo = $${paramIndex++}`;
      params.push(filters.tipo);
    }
    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters?.dataInicio) {
      query += ` AND data >= $${paramIndex++}`;
      params.push(filters.dataInicio);
    }
    if (filters?.dataFim) {
      query += ` AND data <= $${paramIndex++}`;
      params.push(filters.dataFim);
    }

    query += ' ORDER BY data DESC';

    const result = await pool.query(query, params);

    return result.rows.map((row: any) => this.mapRowToLancamento(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Lancamento>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const camelCols = new Set([
      'dataVencimento','dataPagamento','vinculadoAlunoId','vinculadoContratoId',
      'recorrenciaTipo','recorrenciaMeses','recorrenciaDataFim','tenantId',
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
      `UPDATE lancamentos SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND "tenantId" = $${paramIndex}`,
      values
    );
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    await pool.query(
      'DELETE FROM lancamentos WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );
  }

  private static mapRowToLancamento(row: any): Lancamento {
    return {
      id: row.id.toString(),
      tipo: row.tipo,
      categoria: row.categoria,
      valor: parseFloat(row.valor),
      data: row.data,
      dataVencimento: row.dataVencimento || undefined,
      dataPagamento: row.dataPagamento || undefined,
      descricao: row.descricao,
      status: row.status,
      vinculadoAlunoId: row.vinculadoAlunoId ? row.vinculadoAlunoId.toString() : undefined,
      vinculadoContratoId: row.vinculadoContratoId ? row.vinculadoContratoId.toString() : undefined,
      recorrenciaTipo: row.recorrenciaTipo || undefined,
      recorrenciaMeses: row.recorrenciaMeses ? parseInt(row.recorrenciaMeses) : undefined,
      recorrenciaDataFim: row.recorrenciaDataFim || undefined,
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
