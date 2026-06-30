import pool from '../config/database';
import { Rota, PontoRota, ParadaRota, LocalizacaoVeiculo } from '../types';

export class RotaModel {
  static async create(rota: Omit<Rota, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const [result] = await pool.execute(
      `INSERT INTO rotas (
        periodo, data, status, motoristaId, veiculoId,
        horaInicio, horaFim, tenantId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ) as any;

    return result.insertId.toString();
  }

  static async findById(id: string, tenantId: string): Promise<Rota | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM rotas WHERE id = ? AND tenantId = ?',
      [id, tenantId]
    ) as any[];

    if (rows.length === 0) return null;

    return this.mapRowToRota(rows[0]);
  }

  static async findAll(tenantId: string, filters?: {
    motoristaId?: string;
    periodo?: string;
    status?: string;
    data?: string;
  }): Promise<Rota[]> {
    let query = 'SELECT * FROM rotas WHERE tenantId = ?';
    const params: any[] = [tenantId];

    if (filters?.motoristaId) {
      query += ' AND motoristaId = ?';
      params.push(filters.motoristaId);
    }
    if (filters?.periodo) {
      query += ' AND periodo = ?';
      params.push(filters.periodo);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.data) {
      query += ' AND data = ?';
      params.push(filters.data);
    }

    query += ' ORDER BY data DESC, horaInicio DESC';

    const [rows] = await pool.execute(query, params) as any[];

    return rows.map((row: any) => this.mapRowToRota(row));
  }

  static async update(id: string, tenantId: string, updates: Partial<Rota>): Promise<void> {
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
      `UPDATE rotas SET ${fields.join(', ')} WHERE id = ? AND tenantId = ?`,
      values
    );
  }

  static async addPonto(ponto: Omit<PontoRota, 'id' | 'createdAt'>): Promise<string> {
    const [result] = await pool.execute(
      `INSERT INTO ponto_rotas (rotaId, alunoId, tipo, enderecoId, ordem, tempoEstimado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ponto.rotaId,
        ponto.alunoId || null,
        ponto.tipo,
        ponto.enderecoId,
        ponto.ordem,
        ponto.tempoEstimado || null,
      ]
    ) as any;

    return result.insertId.toString();
  }

  static async getPontos(rotaId: string): Promise<PontoRota[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM ponto_rotas WHERE rotaId = ? ORDER BY ordem',
      [rotaId]
    ) as any[];

    return rows.map((row: any) => ({
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
    const [result] = await pool.execute(
      `INSERT INTO parada_rotas (rotaId, pontoId, horaChegada, horaSaida, notificacaoEnviada)
       VALUES (?, ?, ?, ?, ?)`,
      [
        parada.rotaId,
        parada.pontoId,
        parada.horaChegada || null,
        parada.horaSaida || null,
        parada.notificacaoEnviada,
      ]
    ) as any;

    return result.insertId.toString();
  }

  static async getParadas(rotaId: string): Promise<ParadaRota[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM parada_rotas WHERE rotaId = ?',
      [rotaId]
    ) as any[];

    return rows.map((row: any) => ({
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
    const [result] = await pool.execute(
      `INSERT INTO localizacao_veiculos (
        veiculoId, latitude, longitude, timestamp, velocidade, direcao, tenantId
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        localizacao.veiculoId,
        localizacao.latitude,
        localizacao.longitude,
        localizacao.timestamp,
        localizacao.velocidade || null,
        localizacao.direcao || null,
        localizacao.tenantId,
      ]
    ) as any;

    return result.insertId.toString();
  }

  static async getLocalizacao(veiculoId: string, tenantId: string): Promise<LocalizacaoVeiculo | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM localizacao_veiculos
       WHERE veiculoId = ? AND tenantId = ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [veiculoId, tenantId]
    ) as any[];

    if (rows.length === 0) return null;

    const row = rows[0];

    return {
      id: rows[0].id.toString(),
      veiculoId: rows[0].veiculoId.toString(),
      latitude: parseFloat(rows[0].latitude),
      longitude: parseFloat(rows[0].longitude),
      timestamp: rows[0].timestamp,
      velocidade: rows[0].velocidade ? parseFloat(rows[0].velocidade) : undefined,
      direcao: rows[0].direcao ? parseFloat(rows[0].direcao) : undefined,
      tenantId: rows[0].tenantId.toString(),
      createdAt: rows[0].createdAt,
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

