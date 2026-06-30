import { Request, Response } from 'express';
import { UserModel } from '../models/UserModel';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios' });
        return;
      }

      const user = await UserModel.verifyPassword(email, password);

      if (!user) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      const token = generateToken({
        userId: user.id,
        userRole: user.role,
        tenantId: user.tenantId,
      });

      // Não retornar a senha
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, password, role, telefone, cpf, motoristaId, tenantId } = req.body;

      if (!nome || !email || !password || !role) {
        res.status(400).json({ error: 'Campos obrigatórios: nome, email, password, role' });
        return;
      }

      // Verificar se email já existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'Email já cadastrado' });
        return;
      }

      const userId = await UserModel.create({
        nome,
        email,
        password,
        role,
        telefone,
        cpf,
        motoristaId,
        tenantId: tenantId || null, // Se não fornecido, será definido depois
      });

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
        return;
      }

      const token = generateToken({
        userId: user.id,
        userRole: user.role,
        tenantId: user.tenantId,
      });

      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const user = await UserModel.findById(req.userId);

      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      const { password: _, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const { nome, email, telefone, cpf, password } = req.body;

      const updates: any = {};
      if (nome) updates.nome = nome;
      if (email) updates.email = email;
      if (telefone !== undefined) updates.telefone = telefone;
      if (cpf !== undefined) updates.cpf = cpf;
      if (password) updates.password = password;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: 'Nenhum campo para atualizar' });
        return;
      }

      // Verificar se o email já existe (se estiver sendo alterado)
      if (email) {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== req.userId) {
          res.status(409).json({ error: 'Email já cadastrado' });
          return;
        }
      }

      await UserModel.update(req.userId, updates);

      const updatedUser = await UserModel.findById(req.userId);
      if (!updatedUser) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getResponsaveisByMotorista(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      if (req.userRole !== 'motorista') {
        res.status(403).json({ error: 'Apenas motoristas podem acessar esta rota' });
        return;
      }

      const responsaveis = await UserModel.findByMotorista(req.userId);

      // Filtrar apenas responsáveis e remover senhas
      const responsaveisFiltrados = responsaveis
        .filter(user => user.role === 'responsavel')
        .map(({ password, ...user }) => user);

      res.json(responsaveisFiltrados);
    } catch (error) {
      console.error('Erro ao buscar responsáveis:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

