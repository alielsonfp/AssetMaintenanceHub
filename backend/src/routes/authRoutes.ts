// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import authController from '../controllers/authController';
import passwordController from '../controllers/passwordController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// Rotas públicas
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/forgot-password', (req, res) => passwordController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => passwordController.resetPassword(req, res));

// Rotas protegidas
router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));

export default router;