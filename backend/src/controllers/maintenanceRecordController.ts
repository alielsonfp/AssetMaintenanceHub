// backend/src/controllers/maintenanceRecordController.ts
import { Request, Response } from 'express';
import maintenanceRecordModel, { CreateMaintenanceRecordData, UpdateMaintenanceRecordData } from '../models/maintenanceRecordModel';

const maintenanceRecordController = {
  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const maintenanceRecords = await maintenanceRecordModel.findAllByUserId(userId);

      return res.json({
        maintenanceRecords,
        total: maintenanceRecords.length
      });
    } catch (error) {
      console.error('Erro ao buscar registros de manutenção:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getByAsset(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const assetId = parseInt(req.params.assetId);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(assetId)) {
        return res.status(400).json({ message: 'ID do ativo inválido' });
      }

      const maintenanceRecords = await maintenanceRecordModel.findByAssetId(assetId, userId);

      return res.json({
        maintenanceRecords,
        total: maintenanceRecords.length,
        assetId
      });
    } catch (error) {
      console.error('Erro ao buscar registros por ativo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const recordId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(recordId)) {
        return res.status(400).json({ message: 'ID do registro inválido' });
      }

      const maintenanceRecord = await maintenanceRecordModel.findById(recordId, userId);

      if (!maintenanceRecord) {
        return res.status(404).json({ message: 'Registro de manutenção não encontrado' });
      }

      return res.json({ maintenanceRecord });
    } catch (error) {
      console.error('Erro ao buscar registro de manutenção:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { asset_id, maintenance_type_id, date_performed, notes, cost }: CreateMaintenanceRecordData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Validações obrigatórias
      if (!asset_id) {
        return res.status(400).json({ message: 'ID do ativo é obrigatório' });
      }

      if (!date_performed) {
        return res.status(400).json({ message: 'Data da manutenção é obrigatória' });
      }

      // Validar formato da data
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date_performed)) {
        return res.status(400).json({ message: 'Formato de data inválido (use YYYY-MM-DD)' });
      }

      // Validar custo se fornecido
      if (cost !== undefined && cost !== null && (cost < 0 || isNaN(cost))) {
        return res.status(400).json({ message: 'Custo deve ser um número positivo' });
      }

      const data: CreateMaintenanceRecordData = {
        asset_id: parseInt(asset_id.toString()),
        maintenance_type_id: maintenance_type_id ? parseInt(maintenance_type_id.toString()) : undefined,
        date_performed,
        notes: notes?.trim(),
        cost: cost ? parseFloat(cost.toString()) : undefined
      };

      const maintenanceRecord = await maintenanceRecordModel.create(userId, data);

      return res.status(201).json({
        message: 'Registro de manutenção criado com sucesso',
        maintenanceRecord
      });
    } catch (error: any) {
      console.error('Erro ao criar registro de manutenção:', error);

      if (error.message.includes('não encontrado') || error.message.includes('não pertence')) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const recordId = parseInt(req.params.id);
      const { maintenance_type_id, date_performed, notes, cost }: UpdateMaintenanceRecordData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(recordId)) {
        return res.status(400).json({ message: 'ID do registro inválido' });
      }

      // Validar formato da data se fornecida
      if (date_performed !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date_performed)) {
          return res.status(400).json({ message: 'Formato de data inválido (use YYYY-MM-DD)' });
        }
      }

      // Validar custo se fornecido
      if (cost !== undefined && cost !== null && (cost < 0 || isNaN(cost))) {
        return res.status(400).json({ message: 'Custo deve ser um número positivo' });
      }

      const updateData: UpdateMaintenanceRecordData = {};

      if (maintenance_type_id !== undefined) {
        updateData.maintenance_type_id = maintenance_type_id ? parseInt(maintenance_type_id.toString()) : null;
      }
      if (date_performed !== undefined) updateData.date_performed = date_performed;
      if (notes !== undefined) updateData.notes = notes?.trim() || null;
      if (cost !== undefined) updateData.cost = cost ? parseFloat(cost.toString()) : null;

      const updatedRecord = await maintenanceRecordModel.update(recordId, userId, updateData);

      return res.json({
        message: 'Registro de manutenção atualizado com sucesso',
        maintenanceRecord: updatedRecord
      });
    } catch (error: any) {
      console.error('Erro ao atualizar registro de manutenção:', error);

      if (error.message.includes('não encontrado') || error.message.includes('não pertence')) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const recordId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(recordId)) {
        return res.status(400).json({ message: 'ID do registro inválido' });
      }

      const deleted = await maintenanceRecordModel.delete(recordId, userId);

      if (!deleted) {
        return res.status(404).json({ message: 'Registro de manutenção não encontrado' });
      }

      return res.json({
        message: 'Registro de manutenção removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar registro de manutenção:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const stats = await maintenanceRecordModel.getStats(userId);

      return res.json({
        stats: {
          totalRecords: parseInt(stats.total_records),
          assetsWithMaintenance: parseInt(stats.assets_with_maintenance),
          totalCost: parseFloat(stats.total_cost) || 0,
          averageCost: parseFloat(stats.average_cost) || 0,
          last30Days: parseInt(stats.last_30_days),
          last90Days: parseInt(stats.last_90_days)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getRecent(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (limit > 50) {
        return res.status(400).json({ message: 'Limite máximo de 50 registros' });
      }

      const recentMaintenances = await maintenanceRecordModel.getRecentMaintenances(userId, limit);

      return res.json({
        maintenanceRecords: recentMaintenances,
        total: recentMaintenances.length,
        limit
      });
    } catch (error) {
      console.error('Erro ao buscar manutenções recentes:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getByDateRange(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Data inicial e final são obrigatórias' });
      }

      const maintenanceRecords = await maintenanceRecordModel.getMaintenancesByDateRange(
        userId,
        startDate as string,
        endDate as string
      );

      return res.json({
        maintenanceRecords,
        total: maintenanceRecords.length,
        dateRange: { startDate, endDate }
      });
    } catch (error) {
      console.error('Erro ao buscar manutenções por período:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getByType(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const typeId = parseInt(req.params.typeId);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(typeId)) {
        return res.status(400).json({ message: 'ID do tipo de manutenção inválido' });
      }

      const maintenanceRecords = await maintenanceRecordModel.getMaintenancesByType(userId, typeId);

      return res.json({
        maintenanceRecords,
        total: maintenanceRecords.length,
        typeId
      });
    } catch (error) {
      console.error('Erro ao buscar manutenções por tipo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
};

export default maintenanceRecordController;