import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RotaModel } from '../models/RotaModel';
import { VeiculoModel } from '../models/VeiculoModel';
import { UserModel } from '../models/UserModel';
import pool from '../config/database';

export class RotaController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const {
        periodo,
        data,
        veiculoId,
        pontos,
      } = req.body;

      const rotaId = await RotaModel.create({
        periodo,
        data: new Date(data),
        status: 'nao_iniciada',
        motoristaId: req.userId!,
        veiculoId,
        tenantId: req.tenantId,
      });

      // Adicionar pontos da rota
      if (pontos && Array.isArray(pontos)) {
        for (let i = 0; i < pontos.length; i++) {
          await RotaModel.addPonto({
            rotaId,
            alunoId: pontos[i].alunoId,
            tipo: pontos[i].tipo,
            enderecoId: pontos[i].enderecoId,
            ordem: i + 1,
            tempoEstimado: pontos[i].tempoEstimado,
          });
        }
      }

      const rota = await RotaModel.findById(rotaId, req.tenantId);
      const pontosRota = await RotaModel.getPontos(rotaId);
      const paradas = await RotaModel.getParadas(rotaId);

      res.status(201).json({
        ...rota,
        pontos: pontosRota,
        paradas,
      });
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const filters: any = {};
      if (req.userRole === 'motorista') {
        filters.motoristaId = req.userId;
      }
      if (req.query.periodo) filters.periodo = req.query.periodo;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.data) filters.data = req.query.data;

      const rotas = await RotaModel.findAll(req.tenantId, filters);

      // Adicionar pontos e paradas a cada rota
      const rotasCompletas = await Promise.all(
        rotas.map(async (rota) => {
          const pontos = await RotaModel.getPontos(rota.id);
          const paradas = await RotaModel.getParadas(rota.id);
          return {
            ...rota,
            pontos,
            paradas,
          };
        })
      );

      res.json(rotasCompletas);
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async findById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;
      const rota = await RotaModel.findById(id, req.tenantId);

      if (!rota) {
        res.status(404).json({ error: 'Rota não encontrada' });
        return;
      }

      const pontos = await RotaModel.getPontos(rota.id);
      const paradas = await RotaModel.getParadas(rota.id);

      res.json({
        ...rota,
        pontos,
        paradas,
      });
    } catch (error) {
      console.error('Erro ao buscar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      await RotaModel.update(id, req.tenantId, updates);
      const rota = await RotaModel.findById(id, req.tenantId);
      const pontos = await RotaModel.getPontos(id);
      const paradas = await RotaModel.getParadas(id);

      res.json({
        ...rota,
        pontos,
        paradas,
      });
    } catch (error) {
      console.error('Erro ao atualizar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async iniciar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;

      await RotaModel.update(id, req.tenantId, {
        status: 'em_andamento',
        horaInicio: new Date(),
      });

      const rota = await RotaModel.findById(id, req.tenantId);
      const pontos = await RotaModel.getPontos(id);
      const paradas = await RotaModel.getParadas(id);

      res.json({
        ...rota,
        pontos,
        paradas,
      });
    } catch (error) {
      console.error('Erro ao iniciar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async finalizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;

      await RotaModel.update(id, req.tenantId, {
        status: 'finalizada',
        horaFim: new Date(),
      });

      const rota = await RotaModel.findById(id, req.tenantId);
      const pontos = await RotaModel.getPontos(id);
      const paradas = await RotaModel.getParadas(id);

      res.json({
        ...rota,
        pontos,
        paradas,
      });
    } catch (error) {
      console.error('Erro ao finalizar rota:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getLocalizacao(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { veiculoId } = req.params;
      const localizacao = await RotaModel.getLocalizacao(veiculoId, req.tenantId);

      if (!localizacao) {
        res.status(404).json({ error: 'Localização não encontrada' });
        return;
      }

      res.json(localizacao);
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async saveLocalizacao(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const {
        veiculoId,
        latitude,
        longitude,
        velocidade,
        direcao,
      } = req.body;

      await RotaModel.saveLocalizacao({
        veiculoId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date(),
        velocidade: velocidade ? parseFloat(velocidade) : undefined,
        direcao: direcao ? parseFloat(direcao) : undefined,
        tenantId: req.tenantId,
      });

      // Renew heartbeat
      await pool.query(
        'UPDATE users SET "lastHeartbeat" = NOW() WHERE id = $1 AND "tenantId" = $2',
        [req.userId, req.tenantId]
      );

      res.json({ message: 'Localização salva com sucesso' });
    } catch (error) {
      console.error('Erro ao salvar localização:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getLocalizacaoMotorista(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId || !req.userId) {
        res.status(400).json({ error: 'Tenant ID ou User ID não encontrado' });
        return;
      }

      // Para responsável, obter motoristaId do usuário
      if (req.userRole === 'responsavel') {
        const result = await pool.query(
          'SELECT "motoristaId" FROM users WHERE id = $1 AND "tenantId" = $2',
          [req.userId, req.tenantId]
        );

        if (result.rows.length === 0 || !result.rows[0].motoristaId) {
          res.status(404).json({ error: 'Motorista não vinculado' });
          return;
        }

        const motoristaId = result.rows[0].motoristaId.toString();

        // Buscar veículo do motorista
        const veiculos = await VeiculoModel.findByMotorista(motoristaId, req.tenantId);

        if (veiculos.length === 0) {
          res.status(404).json({ error: 'Nenhum veículo encontrado para este motorista' });
          return;
        }

        // Obter localização do primeiro veículo
        const veiculoId = veiculos[0].id;
        const localizacao = await RotaModel.getLocalizacao(veiculoId, req.tenantId);

        if (!localizacao) {
          res.status(404).json({ error: 'Localização não encontrada' });
          return;
        }

        res.json(localizacao);
        return;
      }

      res.status(403).json({ error: 'Acesso negado' });
    } catch (error) {
      console.error('Erro ao buscar localização do motorista:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async goOnline(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId || !req.userId) {
        res.status(400).json({ error: 'Tenant ID ou User ID não encontrado' });
        return;
      }

      const user = await UserModel.findById(req.userId);
      if (user?.statusOnline) {
        res.status(409).json({
          error: 'Motorista já está online',
          statusOnline: true,
          lastHeartbeat: user.lastHeartbeat,
        });
        return;
      }

      await pool.query(
        `UPDATE users SET "statusOnline" = TRUE, "lastHeartbeat" = NOW() WHERE id = $1 AND "tenantId" = $2`,
        [req.userId, req.tenantId]
      );

      const notifResult = await pool.query(
        `INSERT INTO notificacoes (tipo, titulo, mensagem, "enviarAgora", status, "remetenteId", "tenantId", "gatilhoTipo")
         VALUES ('especifico', 'Motorista Online', 'A van iniciou a operação.', TRUE, 'enviada', $1, $2, 'rota_inicio')
         RETURNING id`,
        [req.userId, req.tenantId]
      );
      const notificacaoId = notifResult.rows[0].id;

      const responsaveisResult = await pool.query(
        `SELECT DISTINCT u.id
         FROM alunos a
         JOIN users u ON u.id = a."responsavelId"
         WHERE a."motoristaId" = $1 AND a.status = 'ativo' AND a."tenantId" = $2 AND u.role = 'responsavel'`,
        [req.userId, req.tenantId]
      );
      const responsaveis = responsaveisResult.rows;

      if (responsaveis.length > 0) {
        // Inserção em batch com placeholders dinâmicos
        const values: any[] = [];
        const placeholders = responsaveis.map((r: any, i: number) => {
          values.push(notificacaoId, r.id);
          return `($${i * 2 + 1}, $${i * 2 + 2})`;
        });
        await pool.query(
          `INSERT INTO notificacao_destinatarios ("notificacaoId", "destinatarioId") VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`,
          values
        );
      }

      res.status(200).json({
        message: 'Motorista online',
        statusOnline: true,
        lastHeartbeat: new Date().toISOString(),
        notificacoesEnviadas: responsaveis.length,
      });
    } catch (error) {
      console.error('Erro ao ficar online:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async goOffline(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId || !req.userId) {
        res.status(400).json({ error: 'Tenant ID ou User ID não encontrado' });
        return;
      }

      const user = await UserModel.findById(req.userId);
      if (!user?.statusOnline) {
        res.status(409).json({
          error: 'Motorista já está offline',
          statusOnline: false,
        });
        return;
      }

      await pool.query(
        `UPDATE users SET "statusOnline" = FALSE WHERE id = $1 AND "tenantId" = $2`,
        [req.userId, req.tenantId]
      );

      const notifResult = await pool.query(
        `INSERT INTO notificacoes (tipo, titulo, mensagem, "enviarAgora", status, "remetenteId", "tenantId", "gatilhoTipo")
         VALUES ('especifico', 'Motorista Offline', 'A van encerrou a operação.', TRUE, 'enviada', $1, $2, 'rota_fim')
         RETURNING id`,
        [req.userId, req.tenantId]
      );
      const notificacaoId = notifResult.rows[0].id;

      const responsaveisResult = await pool.query(
        `SELECT DISTINCT u.id
         FROM alunos a
         JOIN users u ON u.id = a."responsavelId"
         WHERE a."motoristaId" = $1 AND a.status = 'ativo' AND a."tenantId" = $2 AND u.role = 'responsavel'`,
        [req.userId, req.tenantId]
      );
      const responsaveis = responsaveisResult.rows;

      if (responsaveis.length > 0) {
        const values: any[] = [];
        const placeholders = responsaveis.map((r: any, i: number) => {
          values.push(notificacaoId, r.id);
          return `($${i * 2 + 1}, $${i * 2 + 2})`;
        });
        await pool.query(
          `INSERT INTO notificacao_destinatarios ("notificacaoId", "destinatarioId") VALUES ${placeholders.join(', ')} ON CONFLICT DO NOTHING`,
          values
        );
      }

      res.status(200).json({
        message: 'Motorista offline',
        statusOnline: false,
        notificacoesEnviadas: responsaveis.length,
      });
    } catch (error) {
      console.error('Erro ao ficar offline:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getMotoristaStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId || !req.userId) {
        res.status(400).json({ error: 'Tenant ID ou User ID não encontrado' });
        return;
      }

      if (req.userRole !== 'responsavel') {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }

      const result = await pool.query(
        `SELECT DISTINCT u.id as "motoristaId", u.nome as "motoristaNome", u."statusOnline", u."lastHeartbeat"
         FROM alunos a
         JOIN users u ON u.id = a."motoristaId"
         WHERE a."responsavelId" = $1 AND a.status = 'ativo' AND a."tenantId" = $2 LIMIT 1`,
        [req.userId, req.tenantId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Nenhum motorista vinculado encontrado' });
        return;
      }

      const m = result.rows[0];
      let online = Boolean(m.statusOnline);
      let expirado = false;

      if (online && m.lastHeartbeat) {
        const now = new Date();
        const hb = new Date(m.lastHeartbeat);
        const diffMs = now.getTime() - hb.getTime();
        if (diffMs > 5 * 60 * 1000) {
          online = false;
          expirado = true;
          await pool.query('UPDATE users SET "statusOnline" = FALSE WHERE id = $1', [m.motoristaId]);
        }
      }

      const veiculos = await VeiculoModel.findByMotorista(m.motoristaId.toString(), req.tenantId);
      if (veiculos.length === 0) {
        res.status(404).json({ error: 'Nenhum veículo encontrado para este motorista' });
        return;
      }

      res.status(200).json({
        motoristaId: m.motoristaId,
        motoristaNome: m.motoristaNome,
        statusOnline: online,
        lastHeartbeat: m.lastHeartbeat,
        heartbeatExpirado: expirado,
        veiculoId: Number(veiculos[0].id),
        veiculoPlaca: veiculos[0].placa,
      });
    } catch (error) {
      console.error('Erro ao buscar status do motorista:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
