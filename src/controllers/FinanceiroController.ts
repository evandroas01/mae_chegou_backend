import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LancamentoModel } from '../models/LancamentoModel';
import pool from '../config/database';
import { ResumoFinanceiro } from '../types';

export class FinanceiroController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const {
        tipo,
        categoria,
        valor,
        data,
        dataVencimento,
        descricao,
        vinculadoAlunoId,
        vinculadoContratoId,
        recorrenciaTipo,
        recorrenciaMeses,
        recorrenciaDataFim,
      } = req.body;

      const status = dataVencimento && new Date(dataVencimento) < new Date() ? 'atrasado' : 'pendente';

      const lancamentoId = await LancamentoModel.create({
        tipo,
        categoria,
        valor: parseFloat(valor),
        data: new Date(data),
        dataVencimento: dataVencimento ? new Date(dataVencimento) : undefined,
        descricao,
        status,
        vinculadoAlunoId: vinculadoAlunoId || undefined,
        vinculadoContratoId: vinculadoContratoId || undefined,
        recorrenciaTipo: recorrenciaTipo || undefined,
        recorrenciaMeses: recorrenciaMeses ? parseInt(recorrenciaMeses) : undefined,
        recorrenciaDataFim: recorrenciaDataFim ? new Date(recorrenciaDataFim) : undefined,
        tenantId: req.tenantId,
      });

      const lancamento = await LancamentoModel.findById(lancamentoId, req.tenantId);

      res.status(201).json(lancamento);
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
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
      if (req.query.tipo) filters.tipo = req.query.tipo;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.dataInicio) filters.dataInicio = req.query.dataInicio;
      if (req.query.dataFim) filters.dataFim = req.query.dataFim;

      const lancamentos = await LancamentoModel.findAll(req.tenantId, filters);

      res.json(lancamentos);
    } catch (error) {
      console.error('Erro ao buscar lançamentos:', error);
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
      const lancamento = await LancamentoModel.findById(id, req.tenantId);

      if (!lancamento) {
        res.status(404).json({ error: 'Lançamento não encontrado' });
        return;
      }

      res.json(lancamento);
    } catch (error) {
      console.error('Erro ao buscar lançamento:', error);
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

      await LancamentoModel.update(id, req.tenantId, updates);
      const lancamento = await LancamentoModel.findById(id, req.tenantId);

      res.json(lancamento);
    } catch (error) {
      console.error('Erro ao atualizar lançamento:', error);
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
      await LancamentoModel.delete(id, req.tenantId);

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar lançamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getResumo(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      // Total receitas do mês
      const [receitas] = await pool.execute(
        `SELECT COALESCE(SUM(valor), 0) as total
         FROM lancamentos
         WHERE tenantId = ? AND tipo = 'receita' AND data >= ? AND data <= ?`,
        [req.tenantId, primeiroDiaMes, ultimoDiaMes]
      ) as any[];

      // Total despesas do mês
      const [despesas] = await pool.execute(
        `SELECT COALESCE(SUM(valor), 0) as total
         FROM lancamentos
         WHERE tenantId = ? AND tipo = 'despesa' AND data >= ? AND data <= ?`,
        [req.tenantId, primeiroDiaMes, ultimoDiaMes]
      ) as any[];

      // Saldo atual (todas as receitas - todas as despesas)
      const [saldo] = await pool.execute(
        `SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) as saldo
         FROM lancamentos
         WHERE tenantId = ? AND status = 'pago'`,
        [req.tenantId]
      ) as any[];

      // Inadimplência
      const [inadimplencia] = await pool.execute(
        `SELECT 
          COALESCE(SUM(valor), 0) as valor,
          COUNT(*) as quantidade
         FROM lancamentos
         WHERE tenantId = ? AND tipo = 'receita' AND status = 'atrasado'`,
        [req.tenantId]
      ) as any[];

      const totalReceitas = receitas[0]?.total || 0;
      const totalDespesas = despesas[0]?.total || 0;
      const saldoAtual = saldo[0]?.saldo || 0;
      const valorInadimplencia = inadimplencia[0]?.valor || 0;
      const quantidadeInadimplencia = inadimplencia[0]?.quantidade || 0;

      const totalReceitasMes = totalReceitas;
      const percentualInadimplencia = totalReceitasMes > 0 
        ? (valorInadimplencia / totalReceitasMes) * 100 
        : 0;

      const resumo: ResumoFinanceiro = {
        saldoAtual: parseFloat(saldoAtual),
        totalReceitasMes: parseFloat(totalReceitasMes),
        totalDespesasMes: parseFloat(totalDespesas),
        saldoMes: parseFloat(totalReceitasMes) - parseFloat(totalDespesas),
        inadimplencia: {
          valor: parseFloat(valorInadimplencia),
          percentual: parseFloat(percentualInadimplencia.toFixed(2)),
          quantidade: parseInt(quantidadeInadimplencia),
        },
      };

      res.json(resumo);
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

