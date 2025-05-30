import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import userModel from '../models/userModel';
import dotenv from 'dotenv';
import db from '../config/db';

dotenv.config();

// Tipagem correta para o payload
interface JwtPayload {
  id: number;
  name: string;
  email: string;
}

// Função para gerar token JWT
function generateToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  } as jwt.SignOptions);
}

const authController = {
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }

      // Verificar se o email já está em uso
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }

      // Criar o usuário
      const user = await userModel.create({ name, email, password });

      // 🎯 NOVO: Criar dados de demonstração
      try {
        await db.query('SELECT create_demo_data($1)', [user.id]);
        console.log(`✅ Dados demo criados para usuário ${user.id}`);
      } catch (demoError) {
        console.error('❌ Erro ao criar dados demo:', demoError);
        // Não falha o registro se der erro nos dados demo
      }

      // Remover o password antes de retornar
      const userWithoutPassword = {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return res.status(201).json({
        user: userWithoutPassword,
        token: generateToken({ id: user.id, name: user.name, email: user.email }),
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário pelo email
      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // Verificar senha
      const passwordMatch = await userModel.validatePassword(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token: generateToken({ id: user.id, name: user.name, email: user.email }),
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const user = await userModel.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      return res.json({ user });
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },
};

export default authController;