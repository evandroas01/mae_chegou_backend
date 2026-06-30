import pool from '../config/database';
import { User, UserRole } from '../types';
import { hashPassword, comparePassword } from '../utils/password';

export class UserModel {
  static async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const hashedPassword = await hashPassword(user.password);
    
    const [result] = await pool.execute(
      `INSERT INTO users (nome, email, password, role, telefone, cpf, motoristaId, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ) as any;

    return result.insertId.toString();
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (rows.length === 0) return null;

    return this.mapRowToUser(rows[0]);
  }

  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    ) as any[];

    if (rows.length === 0) return null;

    return this.mapRowToUser(rows[0]);
  }

  static async findByTenant(tenantId: string, role?: UserRole): Promise<User[]> {
    let query = 'SELECT * FROM users WHERE tenantId = ?';
    const params: any[] = [tenantId];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    const [rows] = await pool.execute(query, params) as any[];

    return rows.map((row: any) => this.mapRowToUser(row));
  }

  static async findByMotorista(motoristaId: string): Promise<User[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE motoristaId = ?',
      [motoristaId]
    ) as any[];

    return rows.map((row: any) => this.mapRowToUser(row));
  }

  static async update(id: string, updates: Partial<User>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.nome) {
      fields.push('nome = ?');
      values.push(updates.nome);
    }
    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.password) {
      const hashedPassword = await hashPassword(updates.password);
      fields.push('password = ?');
      values.push(hashedPassword);
    }
    if (updates.telefone !== undefined) {
      fields.push('telefone = ?');
      values.push(updates.telefone);
    }
    if (updates.cpf !== undefined) {
      fields.push('cpf = ?');
      values.push(updates.cpf);
    }
    if (updates.statusOnline !== undefined) {
      fields.push('statusOnline = ?');
      values.push(updates.statusOnline);
    }
    if (updates.lastHeartbeat !== undefined) {
      fields.push('lastHeartbeat = ?');
      values.push(updates.lastHeartbeat);
    }

    fields.push('updatedAt = NOW()');
    values.push(id);

    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

