import pool from '../config/database';
import { Veiculo, DocumentoVeiculo } from '../types';

export class VeiculoModel {
  static async create(veiculo: Omit<Veiculo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const [result] = await pool.execute(
      `INSERT INTO veiculos (placa, modelo, ano, quilometragemAtual, motoristaId, tenantId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        veiculo.placa,
        veiculo.modelo,
        veiculo.ano,
        veiculo.quilometragemAtual,
        veiculo.motoristaId,
        veiculo.tenantId,
      ]
    ) as any;

    return result.insertId.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Veiculo | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM veiculos WHERE id = ? AND tenantId = ?',
      [id, tenantId]
    ) as any[];

    if (rows.length === 0) return null;

    return this.mapRowToVeiculo(rows[0]);
  }

  static async findByMotorista(motoristaId: string, tenantId: string): Promise<Veiculo[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM veiculos WHERE motoristaId = ? AND tenantId = ?',
      [motoristaId, tenantId]
    ) as any[];

    return rows.map((row: any) => this.mapRowToVeiculo(row));
  }

  static async findAll(tenantId: string): Promise<Veiculo[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM veiculos WHERE tenantId = ?',
      [tenantId]
    ) as any[];

    return rows.map((row: any) => this.mapRowToVeiculo(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Veiculo>): Promise<void> {
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
      `UPDATE veiculos SET ${fields.join(', ')} WHERE id = ? AND tenantId = ?`,
      values
    );
  }

  static async addDocumento(documento: Omit<DocumentoVeiculo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const [result] = await pool.execute(
      `INSERT INTO documento_veiculos (veiculoId, tipo, numero, validade, arquivoUrl, tenantId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        documento.veiculoId,
        documento.tipo,
        documento.numero,
        documento.validade,
        documento.arquivoUrl || null,
        documento.tenantId,
      ]
    ) as any;

    return result.insertId.toString();
  }

  static async getDocumentos(veiculoId: string, tenantId: string): Promise<DocumentoVeiculo[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM documento_veiculos WHERE veiculoId = ? AND tenantId = ?',
      [veiculoId, tenantId]
    ) as any[];

    return rows.map((row: any) => ({
      id: row.id.toString(),
      veiculoId: row.veiculoId.toString(),
      tipo: row.tipo,
      numero: row.numero,
      validade: row.validade,
      arquivoUrl: row.arquivoUrl || undefined,
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  private static mapRowToVeiculo(row: any): Veiculo {
    return {
      id: row.id.toString(),
      placa: row.placa,
      modelo: row.modelo,
      ano: parseInt(row.ano),
      quilometragemAtual: parseInt(row.quilometragemAtual),
      motoristaId: row.motoristaId.toString(),
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

