// backend/src/routes/assetRoutes.ts
import { Router } from 'express';
import assetsController from '../controllers/assetsController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/assets - Buscar todos os ativos do usuário
router.get('/', (req, res) => assetsController.getAll(req, res));

// GET /api/assets/stats - Buscar estatísticas dos ativos
router.get('/stats', (req, res) => assetsController.getStats(req, res));

// GET /api/assets/:id - Buscar ativo específico
router.get('/:id', (req, res) => assetsController.getById(req, res));

// POST /api/assets - Criar novo ativo
router.post('/', (req, res) => assetsController.create(req, res));

// PUT /api/assets/:id - Atualizar ativo
router.put('/:id', (req, res) => assetsController.update(req, res));

// DELETE /api/assets/:id - Deletar ativo
router.delete('/:id', (req, res) => assetsController.delete(req, res));

export default router;