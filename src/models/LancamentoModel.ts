import pool from '../config/database';
import { Lancamento } from '../types';

export class LancamentoModel {
  static async create(lancamento: Omit<Lancamento, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const [result] = await pool.execute(
      `INSERT INTO lancamentos (
        tipo, categoria, valor, data, dataVencimento, dataPagamento,
        descricao, status, vinculadoAlunoId, vinculadoContratoId,
        recorrenciaTipo, recorrenciaMeses, recorrenciaDataFim, tenantId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ) as any;

    return result.insertId.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Lancamento | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM lancamentos WHERE id = ? AND tenantId = ?',
      [id, tenantId]
    ) as any[];

    if (rows.length === 0) return null;

    return this.mapRowToLancamento(rows[0]);
  }

  static async findAll(tenantId: string, filters?: {
    tipo?: string;
    status?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<Lancamento[]> {
    let query = 'SELECT * FROM lancamentos WHERE tenantId = ?';
    const params: any[] = [tenantId];

    if (filters?.tipo) {
      query += ' AND tipo = ?';
      params.push(filters.tipo);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.dataInicio) {
      query += ' AND data >= ?';
      params.push(filters.dataInicio);
    }
    if (filters?.dataFim) {
      query += ' AND data <= ?';
      params.push(filters.dataFim);
    }

    query += ' ORDER BY data DESC';

    const [rows] = await pool.execute(query, params) as any[];

    return rows.map((row: any) => this.mapRowToLancamento(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Lancamento>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.keys(updates).forEach((key) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'tenantId') {
        fields.push(`${key} = ?`);
        values.push((updates as any)[key]);
      }
    });

    fields.push('updatedAt = NOW()');
    values.push(id, tenantId);

    await pool.execute(
      `UPDATE lancamentos SET ${fields.join(', ')} WHERE id = ? AND tenantId = ?`,
      values
    );
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    await pool.execute(
      'DELETE FROM lancamentos WHERE id = ? AND tenantId = ?',
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

