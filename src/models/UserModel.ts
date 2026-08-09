import pool from '../config/database';
import { User, UserRole } from '../types';
import { hashPassword, comparePassword } from '../utils/password';

export class UserModel {
  static async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const hashedPassword = await hashPassword(user.password);

    const result = await pool.query(
      `INSERT INTO users (nome, email, password, role, telefone, cpf, "motoristaId", "tenantId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        user.nome,
        user.email,
        hashedPassword,
        user.role,
        user.telefone || null,
        user.cpf || null,
        user.motoristaId || null,
        user.tenantId || null,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToUser(result.rows[0]);
  }

  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToUser(result.rows[0]);
  }

  static async findByTenant(tenantId: string, role?: UserRole): Promise<User[]> {
    let query = 'SELECT * FROM users WHERE "tenantId" = $1';
    const params: any[] = [tenantId];

    if (role) {
      query += ' AND role = $2';
      params.push(role);
    }

    const result = await pool.query(query, params);

    return result.rows.map((row: any) => this.mapRowToUser(row));
  }

  static async findByMotorista(motoristaId: string): Promise<User[]> {
    const result = await pool.query(
      'SELECT * FROM users WHERE "motoristaId" = $1',
      [motoristaId]
    );

    return result.rows.map((row: any) => this.mapRowToUser(row));
  }

  static async update(id: string, updates: Partial<User>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.nome) {
      fields.push(`nome = $${paramIndex++}`);
      values.push(updates.nome);
    }
    if (updates.email) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.password) {
      const hashedPassword = await hashPassword(updates.password);
      fields.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }
    if (updates.telefone !== undefined) {
      fields.push(`telefone = $${paramIndex++}`);
      values.push(updates.telefone);
    }
    if (updates.cpf !== undefined) {
      fields.push(`cpf = $${paramIndex++}`);
      values.push(updates.cpf);
    }
    if (updates.statusOnline !== undefined) {
      fields.push(`"statusOnline" = $${paramIndex++}`);
      values.push(updates.statusOnline);
    }
    if (updates.lastHeartbeat !== undefined) {
      fields.push(`"lastHeartbeat" = $${paramIndex++}`);
      values.push(updates.lastHeartbeat);
    }
    const extraCols = ['cnhNumero', 'cnhValidade', 'banco', 'agencia', 'conta', 'pix', 'vagasManha', 'vagasTarde', 'vagasNoite'];
    extraCols.forEach(col => {
      if ((updates as any)[col] !== undefined) {
        fields.push(`"${col}" = $${paramIndex++}`);
        values.push((updates as any)[col] || null);
      }
    });
    if ((updates as any).configuracoes) {
      fields.push(`configuracoes = $${paramIndex++}`);
      values.push((updates as any).configuracoes);
    }

    if (fields.length === 0) return;

    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return null;

    return user;
  }

  private static mapRowToUser(row: any): User {
    return {
      id: row.id.toString(),
      nome: row.nome,
      email: row.email,
      password: row.password,
      role: row.role,
      telefone: row.telefone,
      cpf: row.cpf,
      motoristaId: row.motoristaId ? row.motoristaId.toString() : undefined,
      tenantId: row.tenantId ? row.tenantId.toString() : undefined,
      statusOnline: Boolean(row.statusOnline),
      lastHeartbeat: row.lastHeartbeat,
      cnhNumero: row.cnhNumero,
      cnhValidade: row.cnhValidade ? new Date(row.cnhValidade).toISOString().split('T')[0] : undefined,
      banco: row.banco,
      agencia: row.agencia,
      conta: row.conta,
      pix: row.pix,
      vagasManha: row.vagasManha,
      vagasTarde: row.vagasTarde,
      vagasNoite: row.vagasNoite,
      configuracoes: row.configuracoes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
