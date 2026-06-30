import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ContratoModel } from '../models/ContratoModel';
import pool from '../config/database';

export class ContratoController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const {
        responsavelId,
        alunoIds,
        periodo,
        valor,
        vencimento,
        dataInicio,
        clausulas,
      } = req.body;

      // Gerar número do contrato
      const [count] = await pool.execute(
        'SELECT COUNT(*) as total FROM contratos WHERE tenantId = ?',
        [req.tenantId]
      ) as any[];
      const numero = `CT-${new Date().getFullYear()}-${String(count[0].total + 1).padStart(3, '0')}`;

      const contratoId = await ContratoModel.create({
        numero,
        responsavelId,
        periodo,
        valor: parseFloat(valor),
        vencimento: parseInt(vencimento),
        statusAssinatura: 'pendente',
        statusPagamento: 'em_dia',
        dataInicio: new Date(dataInicio),
        clausulas: clausulas || null,
        tenantId: req.tenantId,
      });

      // Adicionar alunos ao contrato
      if (alunoIds && Array.isArray(alunoIds)) {
        for (const alunoId of alunoIds) {
          await ContratoModel.addAluno(contratoId, alunoId);
        }
      }

      // Criar log
      await ContratoModel.addLog({
        contratoId,
        acao: 'criado',
        data: new Date(),
      });

      const contrato = await ContratoModel.findById(contratoId, req.tenantId);

      res.status(201).json(contrato);
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
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
      if (req.userRole === 'responsavel') {
        filters.responsavelId = req.userId;
      }
      if (req.query.statusAssinatura) {
        filters.statusAssinatura = req.query.statusAssinatura;
      }
      if (req.query.statusPagamento) {
        filters.statusPagamento = req.query.statusPagamento;
      }

      const contratos = await ContratoModel.findAll(req.tenantId, filters);

      // Adicionar alunos e logs a cada contrato
      const contratosCompletos = await Promise.all(
        contratos.map(async (contrato) => {
          const alunoIds = await ContratoModel.getAlunos(contrato.id);
          const logs = await ContratoModel.getLogs(contrato.id);
          return {
            ...contrato,
            alunoIds,
            logs,
          };
        })
      );

      res.json(contratosCompletos);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
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
      const contrato = await ContratoModel.findById(id, req.tenantId);

      if (!contrato) {
        res.status(404).json({ error: 'Contrato não encontrado' });
        return;
      }

      const alunoIds = await ContratoModel.getAlunos(contrato.id);
      const logs = await ContratoModel.getLogs(contrato.id);

      res.json({
        ...contrato,
        alunoIds,
        logs,
      });
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
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

      await ContratoModel.update(id, req.tenantId, updates);
      const contrato = await ContratoModel.findById(id, req.tenantId);

      res.json(contrato);
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;
      await ContratoModel.delete(id, req.tenantId);

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async assinar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;

      await ContratoModel.update(id, req.tenantId, {
        statusAssinatura: 'assinado',
        dataAssinatura: new Date(),
      });

      await ContratoModel.addLog({
        contratoId: id,
        acao: 'assinado',
        data: new Date(),
      });

      const contrato = await ContratoModel.findById(id, req.tenantId);

      res.json(contrato);
    } catch (error) {
      console.error('Erro ao assinar contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async cancelar(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const { id } = req.params;
      const { motivo } = req.body;

      await ContratoModel.update(id, req.tenantId, {
        statusAssinatura: 'cancelado',
      });

      await ContratoModel.addLog({
        contratoId: id,
        acao: 'cancelado',
        data: new Date(),
        observacoes: motivo,
      });

      const contrato = await ContratoModel.findById(id, req.tenantId);

      res.json(contrato);
    } catch (error) {
      console.error('Erro ao cancelar contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

