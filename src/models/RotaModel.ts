import pool from '../config/database';
import { Rota, PontoRota, ParadaRota, LocalizacaoVeiculo } from '../types';

export class RotaModel {
  static async create(rota: Omit<Rota, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO rotas (
        periodo, data, status, "motoristaId", "veiculoId",
        "horaInicio", "horaFim", "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        rota.periodo,
        rota.data,
        rota.status,
        rota.motoristaId,
        rota.veiculoId,
        rota.horaInicio || null,
        rota.horaFim || null,
        rota.tenantId,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Rota | null> {
    const result = await pool.query(
      'SELECT * FROM rotas WHERE id = $1 AND "tenantId" = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) return null;

    return this.mapRowToRota(result.rows[0]);
  }

  static async findAll(tenantId: string, filters?: {
    motoristaId?: string;
    periodo?: string;
    status?: string;
    data?: string;
  }): Promise<Rota[]> {
    let query = 'SELECT * FROM rotas WHERE "tenantId" = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.motoristaId) {
      query += ` AND "motoristaId" = $${paramIndex++}`;
      params.push(filters.motoristaId);
    }
    if (filters?.periodo) {
      query += ` AND periodo = $${paramIndex++}`;
      params.push(filters.periodo);
    }
    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters?.data) {
      query += ` AND data = $${paramIndex++}`;
      params.push(filters.data);
    }

    query += ' ORDER BY data DESC, "horaInicio" DESC';

    const result = await pool.query(query, params);

    return result.rows.map((row: any) => this.mapRowToRota(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Rota>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const camelCols = new Set(['motoristaId','veiculoId','horaInicio','horaFim','tenantId','createdAt','updatedAt']);
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
      `UPDATE rotas SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND "tenantId" = $${paramIndex}`,
      values
    );
  }

  static async addPonto(ponto: Omit<PontoRota, 'id' | 'createdAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO ponto_rotas ("rotaId", "alunoId", tipo, "enderecoId", ordem, "tempoEstimado")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        ponto.rotaId,
        ponto.alunoId || null,
        ponto.tipo,
        ponto.enderecoId,
        ponto.ordem,
        ponto.tempoEstimado || null,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async getPontos(rotaId: string): Promise<PontoRota[]> {
    const result = await pool.query(
      'SELECT * FROM ponto_rotas WHERE "rotaId" = $1 ORDER BY ordem',
      [rotaId]
    );

    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      rotaId: row.rotaId.toString(),
      alunoId: row.alunoId ? row.alunoId.toString() : undefined,
      tipo: row.tipo,
      enderecoId: row.enderecoId.toString(),
      ordem: parseInt(row.ordem),
      tempoEstimado: row.tempoEstimado ? parseInt(row.tempoEstimado) : undefined,
      createdAt: row.createdAt,
    }));
  }

  static async addParada(parada: Omit<ParadaRota, 'id' | 'createdAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO parada_rotas ("rotaId", "pontoId", "horaChegada", "horaSaida", "notificacaoEnviada")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        parada.rotaId,
        parada.pontoId,
        parada.horaChegada || null,
        parada.horaSaida || null,
        parada.notificacaoEnviada,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async getParadas(rotaId: string): Promise<ParadaRota[]> {
    const result = await pool.query(
      'SELECT * FROM parada_rotas WHERE "rotaId" = $1',
      [rotaId]
    );

    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      rotaId: row.rotaId.toString(),
      pontoId: row.pontoId.toString(),
      horaChegada: row.horaChegada || undefined,
      horaSaida: row.horaSaida || undefined,
      notificacaoEnviada: Boolean(row.notificacaoEnviada),
      createdAt: row.createdAt,
    }));
  }

  static async saveLocalizacao(localizacao: Omit<LocalizacaoVeiculo, 'id' | 'createdAt'>): Promise<string> {
    const result = await pool.query(
      `INSERT INTO localizacao_veiculos (
        "veiculoId", latitude, longitude, timestamp, velocidade, direcao, "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        localizacao.veiculoId,
        localizacao.latitude,
        localizacao.longitude,
        localizacao.timestamp,
        localizacao.velocidade || null,
        localizacao.direcao || null,
        localizacao.tenantId,
      ]
    );

    return result.rows[0].id.toString();
  }

  static async getLocalizacao(veiculoId: string, tenantId: string): Promise<LocalizacaoVeiculo | null> {
    const result = await pool.query(
      `SELECT * FROM localizacao_veiculos
       WHERE "veiculoId" = $1 AND "tenantId" = $2
       ORDER BY timestamp DESC
       LIMIT 1`,
      [veiculoId, tenantId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return {
      id: row.id.toString(),
      veiculoId: row.veiculoId.toString(),
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      timestamp: row.timestamp,
      velocidade: row.velocidade ? parseFloat(row.velocidade) : undefined,
      direcao: row.direcao ? parseFloat(row.direcao) : undefined,
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
    };
  }

  private static mapRowToRota(row: any): Rota {
    return {
      id: row.id.toString(),
      periodo: row.periodo,
      data: row.data,
      status: row.status,
      motoristaId: row.motoristaId.toString(),
      veiculoId: row.veiculoId.toString(),
      horaInicio: row.horaInicio || undefined,
      horaFim: row.horaFim || undefined,
      tenantId: row.tenantId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
