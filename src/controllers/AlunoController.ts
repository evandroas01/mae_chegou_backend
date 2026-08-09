import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AlunoModel } from '../models/AlunoModel';
import { LancamentoModel } from '../models/LancamentoModel';
import pool from '../config/database';

export class AlunoController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      const {
        nome,
        dataNascimento,
        serie,
        turma,
        periodo,
        status,
        escola,
        responsavel,
        enderecoContratante,
        enderecoSaida,
        valorMensal,
        formaPagamento,
        diasSemana,
        datasVencimento,
        motoristaId,
      } = req.body;

      // Criar escola se não existir
      let escolaId: string;
      const escolaResult = await pool.query(
        'SELECT id FROM escolas WHERE nome = $1 AND "tenantId" = $2',
        [escola.nome, req.tenantId]
      );

      if (escolaResult.rows.length > 0) {
        escolaId = escolaResult.rows[0].id.toString();
      } else {
        const newEscola = await pool.query(
          `INSERT INTO escolas (nome, endereco, cidade, estado, cep, "tenantId")
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [escola.nome, escola.endereco, 'São Paulo', 'SP', '00000-000', req.tenantId]
        );
        escolaId = newEscola.rows[0].id.toString();
      }

      // Criar endereço contratante
      const endContratante = await pool.query(
        `INSERT INTO enderecos (rua, numero, complemento, bairro, cidade, estado, cep, "tenantId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          enderecoContratante.rua,
          enderecoContratante.numero,
          enderecoContratante.complemento || null,
          enderecoContratante.bairro,
          enderecoContratante.cidade,
          enderecoContratante.estado,
          enderecoContratante.cep,
          req.tenantId,
        ]
      );
      const enderecoContratanteId = endContratante.rows[0].id.toString();

      // Criar endereço saída se fornecido
      let enderecoSaidaId: string | undefined;
      if (enderecoSaida) {
        const endSaida = await pool.query(
          `INSERT INTO enderecos (rua, numero, complemento, bairro, cidade, estado, cep, "tenantId")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            enderecoSaida.rua,
            enderecoSaida.numero,
            enderecoSaida.complemento || null,
            enderecoSaida.bairro,
            enderecoSaida.cidade,
            enderecoSaida.estado,
            enderecoSaida.cep,
            req.tenantId,
          ]
        );
        enderecoSaidaId = endSaida.rows[0].id.toString();
      }

      // Se responsável tem ID, usar diretamente (responsável existente)
      let responsavelId: string;
      if ((responsavel as any).id) {
        const responsavelExistente = await pool.query(
          'SELECT id FROM users WHERE id = $1 AND "motoristaId" = $2 AND "tenantId" = $3 AND role = \'responsavel\'',
          [(responsavel as any).id, req.userId, req.tenantId]
        );

        if (responsavelExistente.rows.length === 0) {
          res.status(400).json({ error: 'Responsável não encontrado ou não vinculado a este motorista' });
          return;
        }

        responsavelId = (responsavel as any).id;
      } else {
        // Buscar ou criar responsável
        const responsaveis = await pool.query(
          'SELECT id FROM users WHERE cpf = $1 AND "tenantId" = $2',
          [responsavel.cpf, req.tenantId]
        );

        if (responsaveis.rows.length > 0) {
          responsavelId = responsaveis.rows[0].id.toString();
        } else {
          const newResp = await pool.query(
            `INSERT INTO users (nome, email, password, role, telefone, cpf, "motoristaId", "tenantId")
             VALUES ($1, $2, $3, 'responsavel', $4, $5, $6, $7) RETURNING id`,
            [
              responsavel.nome,
              responsavel.email || `${responsavel.cpf}@temp.com`,
              'temp_password',
              responsavel.telefone,
              responsavel.cpf,
              motoristaId || req.userId!,
              req.tenantId,
            ]
          );
          responsavelId = newResp.rows[0].id.toString();
        }
      }

      // Criar aluno
      const alunoId = await AlunoModel.create({
        nome,
        dataNascimento: new Date(dataNascimento),
        serie,
        turma,
        periodo,
        status: status || 'ativo',
        escolaId,
        responsavelId,
        motoristaId: motoristaId || req.userId!,
        enderecoContratanteId,
        enderecoSaidaId,
        valorMensal: parseFloat(valorMensal),
        formaPagamento,
        diasSemana: JSON.stringify(diasSemana),
        datasVencimento: JSON.stringify(datasVencimento),
        tenantId: req.tenantId,
      });

      const aluno = await AlunoModel.findById(alunoId, req.tenantId);

      // Gerar o primeiro lançamento financeiro pendente (Mensalidade)
      if (valorMensal && parseFloat(valorMensal) > 0) {
        const primeiroVencimento = datasVencimento && datasVencimento.length > 0 ? datasVencimento[0] : 5;
        const dataVencimento = new Date();
        dataVencimento.setDate(primeiroVencimento);
        if (dataVencimento < new Date()) {
          dataVencimento.setMonth(dataVencimento.getMonth() + 1); // Passa pro próximo mês se o dia já passou
        }

        await LancamentoModel.create({
          tipo: 'receita',
          categoria: 'receita_recorrente',
          valor: parseFloat(valorMensal),
          data: new Date(),
          dataVencimento: dataVencimento,
          descricao: `Mensalidade Inicial - ${nome}`,
          status: 'pendente',
          vinculadoAlunoId: alunoId,
          tenantId: req.tenantId,
        });
      }

      res.status(201).json(aluno);
    } catch (error) {
      console.error('Erro ao criar aluno:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.tenantId) {
        res.status(400).json({ error: 'Tenant ID não encontrado' });
        return;
      }

      let alunos;

      if (req.userRole === 'motorista') {
        alunos = await AlunoModel.findByMotorista(req.userId!, req.tenantId);
      } else if (req.userRole === 'responsavel') {
        alunos = await AlunoModel.findByResponsavel(req.userId!, req.tenantId);
      } else {
        alunos = await AlunoModel.findAll(req.tenantId);
      }

      res.json(alunos);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
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
      const aluno = await AlunoModel.findById(id, req.tenantId);

      if (!aluno) {
        res.status(404).json({ error: 'Aluno não encontrado' });
        return;
      }

      res.json(aluno);
    } catch (error) {
      console.error('Erro ao buscar aluno:', error);
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

      await AlunoModel.update(id, req.tenantId, updates);
      const aluno = await AlunoModel.findById(id, req.tenantId);

      res.json(aluno);
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error);
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
      await AlunoModel.delete(id, req.tenantId);

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar aluno:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
