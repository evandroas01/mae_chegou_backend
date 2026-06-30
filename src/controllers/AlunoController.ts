import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AlunoModel } from '../models/AlunoModel';
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
      const [escolas] = await pool.execute(
        'SELECT id FROM escolas WHERE nome = ? AND tenantId = ?',
        [escola.nome, req.tenantId]
      ) as any[];

      if (escolas.length > 0) {
        escolaId = escolas[0].id.toString();
      } else {
        const [result] = await pool.execute(
          `INSERT INTO escolas (nome, endereco, cidade, estado, cep, tenantId)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [escola.nome, escola.endereco, 'São Paulo', 'SP', '00000-000', req.tenantId]
        ) as any;
        escolaId = result.insertId.toString();
      }

      // Criar endereço contratante
      const [endContratante] = await pool.execute(
        `INSERT INTO enderecos (rua, numero, complemento, bairro, cidade, estado, cep, tenantId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ) as any;
      const enderecoContratanteId = endContratante.insertId.toString();

      // Criar endereço saída se fornecido
      let enderecoSaidaId: string | undefined;
      if (enderecoSaida) {
        const [endSaida] = await pool.execute(
          `INSERT INTO enderecos (rua, numero, complemento, bairro, cidade, estado, cep, tenantId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
        ) as any;
        enderecoSaidaId = endSaida.insertId.toString();
      }

      // Se responsável tem ID, usar diretamente (responsável existente)
      let responsavelId: string;
      if ((responsavel as any).id) {
        // Verificar se o responsável existe e está vinculado ao motorista
        const [responsavelExistente] = await pool.execute(
          'SELECT id FROM users WHERE id = ? AND motoristaId = ? AND tenantId = ? AND role = "responsavel"',
          [(responsavel as any).id, req.userId, req.tenantId]
        ) as any[];
        
        if (responsavelExistente.length === 0) {
          res.status(400).json({ error: 'Responsável não encontrado ou não vinculado a este motorista' });
          return;
        }
        
        responsavelId = (responsavel as any).id;
      } else {
        // Buscar ou criar responsável
        const [responsaveis] = await pool.execute(
          'SELECT id FROM users WHERE cpf = ? AND tenantId = ?',
          [responsavel.cpf, req.tenantId]
        ) as any[];

        if (responsaveis.length > 0) {
          responsavelId = responsaveis[0].id.toString();
        } else {
        // Criar responsável como usuário
        const [result] = await pool.execute(
          `INSERT INTO users (nome, email, password, role, telefone, cpf, motoristaId, tenantId)
           VALUES (?, ?, ?, 'responsavel', ?, ?, ?, ?)`,
          [
            responsavel.nome,
            responsavel.email || `${responsavel.cpf}@temp.com`,
            'temp_password', // Senha temporária
            responsavel.telefone,
            responsavel.cpf,
            motoristaId || req.userId!, // Vincular ao motorista
            req.tenantId,
          ]
        ) as any;
            responsavelId = result.insertId.toString();
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

