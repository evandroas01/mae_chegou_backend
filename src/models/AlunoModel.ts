import pool from '../config/database';
import { Aluno } from '../types';

export class AlunoModel {
  static async create(aluno: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const [result] = await pool.execute(
      `INSERT INTO alunos (
        nome, dataNascimento, serie, turma, periodo, status,
        escolaId, responsavelId, motoristaId, enderecoContratanteId,
        enderecoSaidaId, valorMensal, formaPagamento, diasSemana,
        datasVencimento, contratoId, tenantId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ) as any;

    return result.insertId.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Aluno | null> {
    const [rows] = await pool.execute(
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
      LEFT JOIN escolas e ON a.escolaId = e.id
      LEFT JOIN users r ON a.responsavelId = r.id
      WHERE a.id = ? AND a.tenantId = ?`,
      [id, tenantId]
    ) as any[];

    if (rows.length === 0) return null;

    return this.mapRowToAlunoWithJoins(rows[0]);
  }

  static async findByMotorista(motoristaId: string, tenantId: string): Promise<Aluno[]> {
    const [rows] = await pool.execute(
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
      LEFT JOIN escolas e ON a.escolaId = e.id
      LEFT JOIN users r ON a.responsavelId = r.id
      WHERE a.motoristaId = ? AND a.tenantId = ? AND a.status = "ativo"`,
      [motoristaId, tenantId]
    ) as any[];

    return rows.map((row: any) => this.mapRowToAlunoWithJoins(row));
  }

  static async findByResponsavel(responsavelId: string, tenantId: string): Promise<Aluno[]> {
    const [rows] = await pool.execute(
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
      LEFT JOIN escolas e ON a.escolaId = e.id
      LEFT JOIN users r ON a.responsavelId = r.id
      WHERE a.responsavelId = ? AND a.tenantId = ?`,
      [responsavelId, tenantId]
    ) as any[];

    return rows.map((row: any) => this.mapRowToAlunoWithJoins(row));
  }

  static async findAll(tenantId: string): Promise<Aluno[]> {
    const [rows] = await pool.execute(
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
      LEFT JOIN escolas e ON a.escolaId = e.id
      LEFT JOIN users r ON a.responsavelId = r.id
      WHERE a.tenantId = ?`,
      [tenantId]
    ) as any[];

    return rows.map((row: any) => this.mapRowToAlunoWithJoins(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Aluno>): Promise<void> {
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
      `UPDATE alunos SET ${fields.join(', ')} WHERE id = ? AND tenantId = ?`,
      values
    );
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    await pool.execute(
      'DELETE FROM alunos WHERE id = ? AND tenantId = ?',
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
    
    // Adicionar dados da escola se disponível
    if (row.escola_nome) {
      (aluno as any).escola = {
        nome: row.escola_nome,
        endereco: row.escola_endereco,
        cidade: row.escola_cidade,
        estado: row.escola_estado,
      };
    }

    // Adicionar dados do responsável se disponível
    if (row.responsavel_nome) {
      (aluno as any).responsavel = {
        nome: row.responsavel_nome,
        telefone: row.responsavel_telefone,
        cpf: row.responsavel_cpf,
      };
    }

    // Adicionar status de pagamento padrão (pode ser melhorado depois)
    (aluno as any).pagamento = {
      status: 'em_dia', // TODO: implementar lógica de pagamento
    };

    return aluno;
  }
}

