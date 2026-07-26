import pool from '../config/database';
import { Aluno } from '../types';

export class AlunoModel {
  static async create(aluno: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO alunos (
        nome, "dataNascimento", serie, turma, periodo, status,
        "escolaId", "responsavelId", "motoristaId", "enderecoContratanteId",
        "enderecoSaidaId", "valorMensal", "formaPagamento", "diasSemana",
        "datasVencimento", "contratoId", "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
      [
        aluno.nome,
        aluno.dataNascimento,
        aluno.serie,
        aluno.turma,
        aluno.periodo,
        aluno.status,
        aluno.escolaId,
        aluno.responsavelId,
        aluno.motoristaId,
        aluno.enderecoContratanteId,
        aluno.enderecoSaidaId || null,
        aluno.valorMensal,
        aluno.formaPagamento,
        aluno.diasSemana,
        aluno.datasVencimento,
        aluno.contratoId || null,
        aluno.tenantId,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Aluno | null> {
    const result = await pool.query(
      `SELECT
        a.*,
        e.nome as escola_nome,
        e.endereco as escola_endereco,
        e.cidade as escola_cidade,
        e.estado as escola_estado,
        r.nome as responsavel_nome,
        r.telefone as responsavel_telefone,
        r.cpf as responsavel_cpf
      FROM alunos a
      LEFT JOIN escolas e ON a."escolaId" = e.id
      LEFT JOIN users r ON a."responsavelId" = r.id
      WHERE a.id = $1 AND a."tenantId" = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToAlunoWithJoins(result.rows[0]);
  }

  static async findByMotorista(motoristaId: string, tenantId: string): Promise<Aluno[]> {
    const result = await pool.query(
      `SELECT
        a.*,
        e.nome as escola_nome,
        e.endereco as escola_endereco,
        e.cidade as escola_cidade,
        e.estado as escola_estado,
        r.nome as responsavel_nome,
        r.telefone as responsavel_telefone,
        r.cpf as responsavel_cpf
      FROM alunos a
      LEFT JOIN escolas e ON a."escolaId" = e.id
      LEFT JOIN users r ON a."responsavelId" = r.id
      WHERE a."motoristaId" = $1 AND a."tenantId" = $2 AND a.status = 'ativo'`,
      [motoristaId, tenantId]
    );

    return result.rows.map((row: any) => this.mapRowToAlunoWithJoins(row));
  }

  static async findByResponsavel(responsavelId: string, tenantId: string): Promise<Aluno[]> {
    const result = await pool.query(
      `SELECT
        a.*,
        e.nome as escola_nome,
        e.endereco as escola_endereco,
        e.cidade as escola_cidade,
        e.estado as escola_estado,
        r.nome as responsavel_nome,
        r.telefone as responsavel_telefone,
        r.cpf as responsavel_cpf
      FROM alunos a
      LEFT JOIN escolas e ON a."escolaId" = e.id
      LEFT JOIN users r ON a."responsavelId" = r.id
      WHERE a."responsavelId" = $1 AND a."tenantId" = $2`,
      [responsavelId, tenantId]
    );

    return result.rows.map((row: any) => this.mapRowToAlunoWithJoins(row));
  }

  static async findAll(tenantId: string): Promise<Aluno[]> {
    const result = await pool.query(
      `SELECT
        a.*,
        e.nome as escola_nome,
        e.endereco as escola_endereco,
        e.cidade as escola_cidade,
        e.estado as escola_estado,
        r.nome as responsavel_nome,
        r.telefone as responsavel_telefone,
        r.cpf as responsavel_cpf
      FROM alunos a
      LEFT JOIN escolas e ON a."escolaId" = e.id
      LEFT JOIN users r ON a."responsavelId" = r.id
      WHERE a."tenantId" = $1`,
      [tenantId]
    );

    return result.rows.map((row: any) => this.mapRowToAlunoWithJoins(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Aluno>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const skipFields = new Set(['id', 'createdAt', 'updatedAt', 'tenantId']);

    Object.keys(updates).forEach((key) => {
      if (!skipFields.has(key)) {
        // Campos com camelCase precisam de aspas no PostgreSQL
        const col = ['dataNascimento','escolaId','responsavelId','motoristaId',
          'enderecoContratanteId','enderecoSaidaId','valorMensal','formaPagamento',
          'diasSemana','datasVencimento','contratoId'].includes(key)
          ? `"${key}"`
          : key;
        fields.push(`${col} = $${paramIndex++}`);
        values.push((updates as any)[key]);
      }
    });

    if (fields.length === 0) return;

    values.push(id, tenantId);

    await pool.query(
      `UPDATE alunos SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND "tenantId" = $${paramIndex}`,
      values
    );
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    await pool.query(
      'DELETE FROM alunos WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );
  }

  private static mapRowToAluno(row: any): Aluno {
    return {
      id: row.id.toString(),
      nome: row.nome,
      dataNascimento: row.dataNascimento,
      serie: row.serie,
      turma: row.turma,
      periodo: row.periodo,
      status: row.status,
      escolaId: row.escolaId.toString(),
      responsavelId: row.responsavelId.toString(),
      motoristaId: row.motoristaId.toString(),
      enderecoContratanteId: row.enderecoContratanteId.toString(),
      enderecoSaidaId: row.enderecoSaidaId ? row.enderecoSaidaId.toString() : undefined,
      valorMensal: parseFloat(row.valorMensal),
      formaPagamento: row.formaPagamento,
      diasSemana: row.diasSemana,
      datasVencimento: row.datasVencimento,
      contratoId: row.contratoId ? row.contratoId.toString() : undefined,
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private static mapRowToAlunoWithJoins(row: any): any {
    const aluno = this.mapRowToAluno(row);

    if (row.escola_nome) {
      (aluno as any).escola = {
        nome: row.escola_nome,
        endereco: row.escola_endereco,
        cidade: row.escola_cidade,
        estado: row.escola_estado,
      };
    }

    if (row.responsavel_nome) {
      (aluno as any).responsavel = {
        nome: row.responsavel_nome,
        telefone: row.responsavel_telefone,
        cpf: row.responsavel_cpf,
      };
    }

    (aluno as any).pagamento = {
      status: 'em_dia', // TODO: implementar lógica de pagamento
    };

    return aluno;
  }
}
