// backend/src/routes/maintenanceTypeRoutes.ts
import { Router } from 'express';
import maintenanceTypeController from '../controllers/maintenanceTypeController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/maintenance-types - Buscar todos os tipos de manutenção do usuário
router.get('/', (req, res) => maintenanceTypeController.getAll(req, res));

// GET /api/maintenance-types/stats - Buscar estatísticas dos tipos
router.get('/stats', (req, res) => maintenanceTypeController.getStats(req, res));

// POST /api/maintenance-types/create-defaults - Criar tipos padrão
router.post('/create-defaults', (req, res) => maintenanceTypeController.createDefaults(req, res));

// GET /api/maintenance-types/:id - Buscar tipo específico
router.get('/:id', (req, res) => maintenanceTypeController.getById(req, res));

// POST /api/maintenance-types - Criar novo tipo
router.post('/', (req, res) => maintenanceTypeController.create(req, res));

// PUT /api/maintenance-types/:id - Atualizar tipo
router.put('/:id', (req, res) => maintenanceTypeController.update(req, res));

// DELETE /api/maintenance-types/:id - Deletar tipo
router.delete('/:id', (req, res) => maintenanceTypeController.delete(req, res));

export default router;