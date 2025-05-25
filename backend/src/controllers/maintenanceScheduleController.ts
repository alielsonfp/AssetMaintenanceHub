// backend/src/controllers/maintenanceScheduleController.ts
import { Request, Response } from 'express';
import maintenanceScheduleModel, { CreateMaintenanceScheduleData, UpdateMaintenanceScheduleData } from '../models/maintenanceScheduleModel';

const maintenanceScheduleController = {
  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Atualizar status de agendamentos atrasados antes de retornar
      await maintenanceScheduleModel.updateOverdueStatus(userId);

      const schedules = await maintenanceScheduleModel.findAllByUserId(userId);

      return res.json({
        schedules,
        total: schedules.length
      });
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
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

      const schedules = await maintenanceScheduleModel.findByAssetId(assetId, userId);

      return res.json({
        schedules,
        total: schedules.length,
        assetId
      });
    } catch (error) {
      console.error('Erro ao buscar agendamentos por ativo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const scheduleId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: 'ID do agendamento inválido' });
      }

      const schedule = await maintenanceScheduleModel.findById(scheduleId, userId);

      if (!schedule) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
      }

      return res.json({ schedule });
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { asset_id, maintenance_type_id, based_on_record_id, frequency_type, frequency_value, scheduled_date }: CreateMaintenanceScheduleData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Validações obrigatórias
      if (!asset_id) {
        return res.status(400).json({ message: 'ID do ativo é obrigatório' });
      }

      if (!frequency_type) {
        return res.status(400).json({ message: 'Tipo de frequência é obrigatório' });
      }

      if (!frequency_value || frequency_value <= 0) {
        return res.status(400).json({ message: 'Valor da frequência deve ser maior que zero' });
      }

      // Validar tipo de frequência
      const validFrequencyTypes = ['days', 'weeks', 'months', 'kilometers', 'hours'];
      if (!validFrequencyTypes.includes(frequency_type)) {
        return res.status(400).json({
          message: 'Tipo de frequência inválido. Use: days, weeks, months, kilometers, hours'
        });
      }

      // Validar formato da data se fornecida
      if (scheduled_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(scheduled_date)) {
          return res.status(400).json({ message: 'Formato de data inválido (use YYYY-MM-DD)' });
        }
      }

      const data: CreateMaintenanceScheduleData = {
        asset_id: parseInt(asset_id.toString()),
        maintenance_type_id: maintenance_type_id ? parseInt(maintenance_type_id.toString()) : undefined,
        based_on_record_id: based_on_record_id ? parseInt(based_on_record_id.toString()) : undefined,
        frequency_type,
        frequency_value: parseInt(frequency_value.toString()),
        scheduled_date
      };

      const schedule = await maintenanceScheduleModel.create(userId, data);

      return res.status(201).json({
        message: 'Agendamento criado com sucesso',
        schedule
      });
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);

      if (error.message.includes('não encontrado') || error.message.includes('não pertence')) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const scheduleId = parseInt(req.params.id);
      const { scheduled_date, status, frequency_type, frequency_value }: UpdateMaintenanceScheduleData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: 'ID do agendamento inválido' });
      }

      // Validar formato da data se fornecida
      if (scheduled_date !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(scheduled_date)) {
          return res.status(400).json({ message: 'Formato de data inválido (use YYYY-MM-DD)' });
        }
      }

      // Validar status se fornecido
      if (status !== undefined) {
        const validStatuses = ['pending', 'completed', 'overdue'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            message: 'Status inválido. Use: pending, completed, overdue'
          });
        }
      }

      // Validar tipo de frequência se fornecido
      if (frequency_type !== undefined) {
        const validFrequencyTypes = ['days', 'weeks', 'months', 'kilometers', 'hours'];
        if (!validFrequencyTypes.includes(frequency_type)) {
          return res.status(400).json({
            message: 'Tipo de frequência inválido. Use: days, weeks, months, kilometers, hours'
          });
        }
      }

      // Validar valor da frequência se fornecido
      if (frequency_value !== undefined && frequency_value <= 0) {
        return res.status(400).json({ message: 'Valor da frequência deve ser maior que zero' });
      }

      const updateData: UpdateMaintenanceScheduleData = {};

      if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
      if (status !== undefined) updateData.status = status;
      if (frequency_type !== undefined) updateData.frequency_type = frequency_type;
      if (frequency_value !== undefined) updateData.frequency_value = frequency_value;

      const updatedSchedule = await maintenanceScheduleModel.update(scheduleId, userId, updateData);

      return res.json({
        message: 'Agendamento atualizado com sucesso',
        schedule: updatedSchedule
      });
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);

      if (error.message.includes('não encontrado') || error.message.includes('não pertence')) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const scheduleId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: 'ID do agendamento inválido' });
      }

      const deleted = await maintenanceScheduleModel.delete(scheduleId, userId);

      if (!deleted) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
      }

      return res.json({
        message: 'Agendamento removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getUpcoming(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const days = parseInt(req.query.days as string) || 7;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (days > 365) {
        return res.status(400).json({ message: 'Período máximo de 365 dias' });
      }

      const upcomingSchedules = await maintenanceScheduleModel.findUpcoming(userId, days);

      return res.json({
        schedules: upcomingSchedules,
        total: upcomingSchedules.length,
        days
      });
    } catch (error) {
      console.error('Erro ao buscar manutenções próximas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getOverdue(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Atualizar status antes de buscar
      await maintenanceScheduleModel.updateOverdueStatus(userId);

      const overdueSchedules = await maintenanceScheduleModel.findOverdue(userId);

      return res.json({
        schedules: overdueSchedules,
        total: overdueSchedules.length
      });
    } catch (error) {
      console.error('Erro ao buscar manutenções atrasadas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async markCompleted(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const scheduleId = parseInt(req.params.id);
      const { recordId } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: 'ID do agendamento inválido' });
      }

      if (!recordId) {
        return res.status(400).json({ message: 'ID do registro de manutenção é obrigatório' });
      }

      const nextSchedule = await maintenanceScheduleModel.markAsCompleted(
        scheduleId,
        userId,
        parseInt(recordId.toString())
      );

      return res.json({
        message: 'Manutenção marcada como concluída e próxima agendada',
        nextSchedule
      });
    } catch (error: any) {
      console.error('Erro ao marcar como concluída:', error);

      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ message: error.message });
      }

      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Atualizar status antes de calcular estatísticas
      await maintenanceScheduleModel.updateOverdueStatus(userId);

      const stats = await maintenanceScheduleModel.getStats(userId);

      return res.json({
        stats: {
          totalSchedules: parseInt(stats.total_schedules),
          pending: parseInt(stats.pending),
          completed: parseInt(stats.completed),
          overdue: parseInt(stats.overdue),
          upcomingWeek: parseInt(stats.upcoming_week),
          upcomingMonth: parseInt(stats.upcoming_month)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
};

export default maintenanceScheduleController;