import pool from '../config/database';
import { Contrato, ContratoAluno, ContratoLog } from '../types';

export class ContratoModel {
  static async create(contrato: Omit<Contrato, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const [result] = await pool.execute(
      `INSERT INTO contratos (
        numero, responsavelId, periodo, valor, vencimento,
        statusAssinatura, statusPagamento, periodoAtraso,
        clausulas, arquivoUrl, dataInicio, dataFim,
        dataEnvio, dataAssinatura, tenantId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ) as any;

    return result.insertId.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Contrato | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM contratos WHERE id = ? AND tenantId = ?',
      [id, tenantId]
    ) as any[];

    if (rows.length === 0) return null;

    return this.mapRowToContrato(rows[0]);
  }

  static async findAll(tenantId: string, filters?: {
    responsavelId?: string;
    statusAssinatura?: string;
    statusPagamento?: string;
  }): Promise<Contrato[]> {
    let query = 'SELECT * FROM contratos WHERE tenantId = ?';
    const params: any[] = [tenantId];

    if (filters?.responsavelId) {
      query += ' AND responsavelId = ?';
      params.push(filters.responsavelId);
    }
    if (filters?.statusAssinatura) {
      query += ' AND statusAssinatura = ?';
      params.push(filters.statusAssinatura);
    }
    if (filters?.statusPagamento) {
      query += ' AND statusPagamento = ?';
      params.push(filters.statusPagamento);
    }

    query += ' ORDER BY createdAt DESC';

    const [rows] = await pool.execute(query, params) as any[];

    return rows.map((row: any) => this.mapRowToContrato(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Contrato>): Promise<void> {
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
      `UPDATE contratos SET ${fields.join(', ')} WHERE id = ? AND tenantId = ?`,
      values
    );
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    await pool.execute(
      'DELETE FROM contratos WHERE id = ? AND tenantId = ?',
      [id, tenantId]
    );
  }

  static async addAluno(contratoId: string, alunoId: string): Promise<void> {
    await pool.execute(
      'INSERT INTO contrato_alunos (contratoId, alunoId) VALUES (?, ?)',
      [contratoId, alunoId]
    );
  }

  static async getAlunos(contratoId: string): Promise<string[]> {
    const [rows] = await pool.execute(
      'SELECT alunoId FROM contrato_alunos WHERE contratoId = ?',
      [contratoId]
    ) as any[];

    return rows.map((row: any) => row.alunoId.toString());
  }

  static async addLog(log: Omit<ContratoLog, 'id' | 'createdAt'>): Promise<void> {
    await pool.execute(
      'INSERT INTO contrato_logs (contratoId, acao, data, observacoes) VALUES (?, ?, ?, ?)',
      [log.contratoId, log.acao, log.data, log.observacoes || null]
    );
  }

  static async getLogs(contratoId: string): Promise<ContratoLog[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM contrato_logs WHERE contratoId = ? ORDER BY data DESC',
      [contratoId]
    ) as any[];

    return rows.map((row: any) => ({
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

