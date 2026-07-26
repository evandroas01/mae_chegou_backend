import pool from '../config/database';
import { Veiculo, DocumentoVeiculo } from '../types';

export class VeiculoModel {
  static async create(veiculo: Omit<Veiculo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO veiculos (placa, modelo, ano, "quilometragemAtual", "motoristaId", "tenantId")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        veiculo.placa,
        veiculo.modelo,
        veiculo.ano,
        veiculo.quilometragemAtual,
        veiculo.motoristaId,
        veiculo.tenantId,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Veiculo | null> {
    const result = await pool.query(
      'SELECT * FROM veiculos WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToVeiculo(result.rows[0]);
  }

  static async findByMotorista(motoristaId: string, tenantId: string): Promise<Veiculo[]> {
    const result = await pool.query(
      'SELECT * FROM veiculos WHERE "motoristaId" = $1 AND "tenantId" = $2',
      [motoristaId, tenantId]
    );

    return result.rows.map((row: any) => this.mapRowToVeiculo(row));
  }

  static async findAll(tenantId: string): Promise<Veiculo[]> {
    const result = await pool.query(
      'SELECT * FROM veiculos WHERE "tenantId" = $1',
      [tenantId]
    );

    return result.rows.map((row: any) => this.mapRowToVeiculo(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Veiculo>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const camelCols = new Set(['quilometragemAtual', 'motoristaId', 'tenantId', 'createdAt', 'updatedAt']);
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
      `UPDATE veiculos SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND "tenantId" = $${paramIndex}`,
      values
    );
  }

  static async addDocumento(documento: Omit<DocumentoVeiculo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO documento_veiculos ("veiculoId", tipo, numero, validade, "arquivoUrl", "tenantId")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        documento.veiculoId,
        documento.tipo,
        documento.numero,
        documento.validade,
        documento.arquivoUrl || null,
        documento.tenantId,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async getDocumentos(veiculoId: string, tenantId: string): Promise<DocumentoVeiculo[]> {
    const result = await pool.query(
      'SELECT * FROM documento_veiculos WHERE "veiculoId" = $1 AND "tenantId" = $2',
      [veiculoId, tenantId]
    );

    return result.rows.map((row: any) => ({
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
