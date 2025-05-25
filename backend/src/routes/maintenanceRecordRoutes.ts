// backend/src/routes/maintenanceRecordRoutes.ts
import { Router } from 'express';
import maintenanceRecordController from '../controllers/maintenanceRecordController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/maintenance-records - Buscar todos os registros do usuário
router.get('/', (req, res) => maintenanceRecordController.getAll(req, res));

// GET /api/maintenance-records/stats - Buscar estatísticas dos registros
router.get('/stats', (req, res) => maintenanceRecordController.getStats(req, res));

// GET /api/maintenance-records/recent - Buscar registros recentes
router.get('/recent', (req, res) => maintenanceRecordController.getRecent(req, res));

// GET /api/maintenance-records/date-range - Buscar por período
router.get('/date-range', (req, res) => maintenanceRecordController.getByDateRange(req, res));

// GET /api/maintenance-records/asset/:assetId - Buscar registros de um ativo específico
router.get('/asset/:assetId', (req, res) => maintenanceRecordController.getByAsset(req, res));

// GET /api/maintenance-records/type/:typeId - Buscar registros por tipo de manutenção
router.get('/type/:typeId', (req, res) => maintenanceRecordController.getByType(req, res));

// GET /api/maintenance-records/:id - Buscar registro específico
router.get('/:id', (req, res) => maintenanceRecordController.getById(req, res));

// POST /api/maintenance-records - Criar novo registro
router.post('/', (req, res) => maintenanceRecordController.create(req, res));

// PUT /api/maintenance-records/:id - Atualizar registro
router.put('/:id', (req, res) => maintenanceRecordController.update(req, res));

// DELETE /api/maintenance-records/:id - Deletar registro
router.delete('/:id', (req, res) => maintenanceRecordController.delete(req, res));

export default router;