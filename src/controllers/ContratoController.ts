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
      } = req.body;

      // Gerar número do contrato único
      const numeroContrato = `CT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const contratoId = await ContratoModel.create({
        numero: numeroContrato,
        responsavelId,
        periodo,
        valor,
        vencimento,
        dataInicio: new Date(dataInicio),
        tenantId: req.tenantId,
      }, alunoIds);

      // Atualizar alunos com o contratoId
      if (alunoIds && alunoIds.length > 0) {
        for (const alunoId of alunoIds) {
          await pool.query(
            `UPDATE alunos SET "contratoId" = $1 WHERE id = $2 AND "tenantId" = $3`,
            [contratoId, alunoId, req.tenantId]
          );
        }
      }

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

      let responsavelId = undefined;
      if (req.userRole === 'responsavel') {
        responsavelId = req.userId;
      }

      const contratos = await ContratoModel.findAll(req.tenantId, responsavelId);
      res.json(contratos);
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

      // Validar acesso se for responsável
      if (req.userRole === 'responsavel' && contrato.responsavelId !== req.userId) {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }

      res.json(contrato);
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

      // Responsáveis só podem assinar
      if (req.userRole === 'responsavel') {
        const contrato = await ContratoModel.findById(id, req.tenantId);
        if (contrato?.responsavelId !== req.userId) {
          res.status(403).json({ error: 'Acesso negado' });
          return;
        }
        
        await ContratoModel.update(id, req.tenantId, { statusAssinatura: 'assinado' });
      } else {
        await ContratoModel.update(id, req.tenantId, updates);
      }

      const contratoAtualizado = await ContratoModel.findById(id, req.tenantId);
      res.json(contratoAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
