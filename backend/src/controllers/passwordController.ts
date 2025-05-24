import { Request, Response } from 'express';
import crypto from 'crypto';
import userModel from '../models/userModel';
import db from '../config/db';
import { sendEmail } from '../services/emailService';
import dotenv from 'dotenv';

dotenv.config();

const passwordController = {
  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório' });
      }

      const user = await userModel.findByEmail(email);
      if (!user) {
        // Por segurança, não informamos se o email existe ou não
        return res.status(200).json({ message: 'Se um usuário com esse email existir, enviaremos instruções de recuperação' });
      }

      // Gerar token
      const token = crypto.randomBytes(20).toString('hex');
      const now = new Date();
      const expireDate = new Date(now);
      expireDate.setHours(now.getHours() + 1); // Expira em 1 hora

      // Salvar o token no banco
      await db.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, token, expireDate]
      );

      // Enviar email com o token
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

      await sendEmail({
        to: email,
        subject: 'Recuperação de senha',
        text: `Você solicitou a recuperação de senha. Use o link a seguir para definir uma nova senha: ${resetUrl}`,
        html: `
          <p>Você solicitou a recuperação de senha.</p>
          <p>Use o link a seguir para definir uma nova senha:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Se você não solicitou isso, ignore este email.</p>
        `
      });

      return res.status(200).json({ message: 'Email de recuperação enviado' });
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
      }

      // Verificar se o token existe e está válido
      const result = await db.query(
        'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ message: 'Token inválido ou expirado' });
      }

      const resetToken = result.rows[0];
      const userId = resetToken.user_id;

      // Atualizar a senha
      await userModel.updatePasswordHash(userId, password);

      // Invalidar o token usado
      await db.query('DELETE FROM password_reset_tokens WHERE id = $1', [resetToken.id]);

      return res.status(200).json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
};

export default passwordController;