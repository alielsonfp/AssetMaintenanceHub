// backend/src/routes/maintenanceScheduleRoutes.ts
import { Router } from 'express';
import maintenanceScheduleController from '../controllers/maintenanceScheduleController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// GET /api/maintenance-schedules - Buscar todos os agendamentos do usuário
router.get('/', (req, res) => maintenanceScheduleController.getAll(req, res));

// GET /api/maintenance-schedules/stats - Buscar estatísticas dos agendamentos
router.get('/stats', (req, res) => maintenanceScheduleController.getStats(req, res));

// GET /api/maintenance-schedules/upcoming - Buscar manutenções próximas
router.get('/upcoming', (req, res) => maintenanceScheduleController.getUpcoming(req, res));

// GET /api/maintenance-schedules/overdue - Buscar manutenções atrasadas
router.get('/overdue', (req, res) => maintenanceScheduleController.getOverdue(req, res));

// GET /api/maintenance-schedules/asset/:assetId - Buscar agendamentos de um ativo específico
router.get('/asset/:assetId', (req, res) => maintenanceScheduleController.getByAsset(req, res));

// POST /api/maintenance-schedules/:id/complete - Marcar agendamento como concluído
router.post('/:id/complete', (req, res) => maintenanceScheduleController.markCompleted(req, res));

// GET /api/maintenance-schedules/:id - Buscar agendamento específico
router.get('/:id', (req, res) => maintenanceScheduleController.getById(req, res));

// POST /api/maintenance-schedules - Criar novo agendamento
router.post('/', (req, res) => maintenanceScheduleController.create(req, res));

// PUT /api/maintenance-schedules/:id - Atualizar agendamento
router.put('/:id', (req, res) => maintenanceScheduleController.update(req, res));

// DELETE /api/maintenance-schedules/:id - Deletar agendamento
router.delete('/:id', (req, res) => maintenanceScheduleController.delete(req, res));

export default router;