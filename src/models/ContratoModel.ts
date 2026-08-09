import pool from '../config/database';

export class ContratoModel {
  static async findAll(tenantId: string, responsavelId?: string): Promise<any[]> {
    let query = `
      SELECT c.*, 
             u.nome as responsavel_nome,
             json_agg(json_build_object('id', a.id, 'nome', a.nome)) as alunos
      FROM contratos c
      INNER JOIN users u ON c."responsavelId" = u.id
      LEFT JOIN contrato_alunos ca ON c.id = ca."contratoId"
      LEFT JOIN alunos a ON ca."alunoId" = a.id
      WHERE c."tenantId" = $1
    `;
    const params: any[] = [tenantId];
    
    if (responsavelId) {
      query += ` AND c."responsavelId" = $2`;
      params.push(responsavelId);
    }

    query += ` GROUP BY c.id, u.nome ORDER BY c."createdAt" DESC`;

    const result = await pool.query(query, params);
    return result.rows.map(this.mapRowToContrato);
  }

  static async findById(id: string, tenantId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT c.*, 
             u.nome as responsavel_nome,
             json_agg(json_build_object('id', a.id, 'nome', a.nome)) as alunos
      FROM contratos c
      INNER JOIN users u ON c."responsavelId" = u.id
      LEFT JOIN contrato_alunos ca ON c.id = ca."contratoId"
      LEFT JOIN alunos a ON ca."alunoId" = a.id
      WHERE c.id = $1 AND c."tenantId" = $2
      GROUP BY c.id, u.nome`,
      [id, tenantId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToContrato(result.rows[0]);
  }

  static async create(contrato: any, alunoIds: string[]): Promise<string> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO contratos (
          numero, "responsavelId", periodo, valor, vencimento,
          "statusAssinatura", "statusPagamento", "dataInicio", "tenantId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          contrato.numero,
          contrato.responsavelId,
          contrato.periodo,
          contrato.valor,
          contrato.vencimento,
          contrato.statusAssinatura || 'pendente',
          contrato.statusPagamento || 'em_dia',
          contrato.dataInicio,
          contrato.tenantId
        ]
      );
      
      const contratoId = result.rows[0].id;

      if (alunoIds && alunoIds.length > 0) {
        for (const alunoId of alunoIds) {
          await client.query(
            `INSERT INTO contrato_alunos ("contratoId", "alunoId") VALUES ($1, $2)`,
            [contratoId, alunoId]
          );
        }
      }

      await client.query('COMMIT');
      return contratoId.toString();
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async update(id: string, tenantId: string, updates: any): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const validKeys = ['statusAssinatura', 'statusPagamento'];

    Object.keys(updates).forEach(key => {
      if (validKeys.includes(key)) {
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length > 0) {
      values.push(id, tenantId);
      await pool.query(
        `UPDATE contratos SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND "tenantId" = $${paramIndex}`,
        values
      );
    }
  }

  private static mapRowToContrato(row: any) {
    return {
      id: row.id.toString(),
      numero: row.numero,
      responsavelId: row.responsavelId.toString(),
      responsavelNome: row.responsavel_nome,
      periodo: row.periodo,
      valor: parseFloat(row.valor),
      vencimento: row.vencimento,
      statusAssinatura: row.statusAssinatura,
      statusPagamento: row.statusPagamento,
      periodoAtraso: row.periodoAtraso,
      dataInicio: row.dataInicio,
      dataFim: row.dataFim,
      tenantId: row.tenantId.toString(),
      alunos: row.alunos.filter((a: any) => a.id !== null), // remove null array items from left join
      createdAt: row.createdAt,
    };
  }
}
