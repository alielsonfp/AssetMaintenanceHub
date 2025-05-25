// backend/src/controllers/maintenanceTypeController.ts
import { Request, Response } from 'express';
import maintenanceTypeModel, { CreateMaintenanceTypeData, UpdateMaintenanceTypeData } from '../models/maintenanceTypeModel';

const maintenanceTypeController = {
  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const maintenanceTypes = await maintenanceTypeModel.findAllByUserId(userId);

      return res.json({
        maintenanceTypes,
        total: maintenanceTypes.length
      });
    } catch (error) {
      console.error('Erro ao buscar tipos de manutenção:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const typeId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(typeId)) {
        return res.status(400).json({ message: 'ID do tipo de manutenção inválido' });
      }

      const maintenanceType = await maintenanceTypeModel.findById(typeId, userId);

      if (!maintenanceType) {
        return res.status(404).json({ message: 'Tipo de manutenção não encontrado' });
      }

      return res.json({ maintenanceType });
    } catch (error) {
      console.error('Erro ao buscar tipo de manutenção:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { name, description, is_default }: CreateMaintenanceTypeData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Nome do tipo de manutenção é obrigatório' });
      }

      const data: CreateMaintenanceTypeData = {
        name: name.trim(),
        description: description?.trim(),
        is_default: is_default || false
      };

      const maintenanceType = await maintenanceTypeModel.create(userId, data);

      return res.status(201).json({
        message: 'Tipo de manutenção criado com sucesso',
        maintenanceType
      });
    } catch (error) {
      console.error('Erro ao criar tipo de manutenção:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const typeId = parseInt(req.params.id);
      const { name, description, is_default }: UpdateMaintenanceTypeData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(typeId)) {
        return res.status(400).json({ message: 'ID do tipo de manutenção inválido' });
      }

      // Verificar se o tipo existe e pertence ao usuário
      const existingType = await maintenanceTypeModel.findById(typeId, userId);
      if (!existingType) {
        return res.status(404).json({ message: 'Tipo de manutenção não encontrado' });
      }

      // Validar campos se fornecidos
      if (name !== undefined && name.trim().length === 0) {
        return res.status(400).json({ message: 'Nome do tipo de manutenção não pode estar vazio' });
      }

      const updateData: UpdateMaintenanceTypeData = {};

      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim();
      if (is_default !== undefined) updateData.is_default = is_default;

      const updatedType = await maintenanceTypeModel.update(typeId, userId, updateData);

      return res.json({
        message: 'Tipo de manutenção atualizado com sucesso',
        maintenanceType: updatedType
      });
    } catch (error) {
      console.error('Erro ao atualizar tipo de manutenção:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const typeId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(typeId)) {
        return res.status(400).json({ message: 'ID do tipo de manutenção inválido' });
      }

      // Verificar se o tipo existe e pertence ao usuário
      const existingType = await maintenanceTypeModel.findById(typeId, userId);
      if (!existingType) {
        return res.status(404).json({ message: 'Tipo de manutenção não encontrado' });
      }

      // Verificar se é tipo padrão (pode ter proteção adicional se necessário)
      if (existingType.is_default) {
        return res.status(400).json({
          message: 'Tipos de manutenção padrão não podem ser removidos'
        });
      }

      const deleted = await maintenanceTypeModel.delete(typeId, userId);

      if (!deleted) {
        return res.status(500).json({ message: 'Erro ao deletar tipo de manutenção' });
      }

      return res.json({
        message: 'Tipo de manutenção removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar tipo de manutenção:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const stats = await maintenanceTypeModel.getStats(userId);

      return res.json({
        stats: {
          total: parseInt(stats.total),
          defaults: parseInt(stats.defaults),
          custom: parseInt(stats.custom)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async createDefaults(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Verificar se já existem tipos padrão
      const existingTypes = await maintenanceTypeModel.findAllByUserId(userId);
      const hasDefaults = existingTypes.some(type => type.is_default);

      if (hasDefaults) {
        return res.status(400).json({
          message: 'Tipos de manutenção padrão já foram criados'
        });
      }

      const defaultTypes = await maintenanceTypeModel.createDefaultTypes(userId);

      return res.status(201).json({
        message: 'Tipos de manutenção padrão criados com sucesso',
        maintenanceTypes: defaultTypes,
        total: defaultTypes.length
      });
    } catch (error) {
      console.error('Erro ao criar tipos padrão:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
};

export default maintenanceTypeController;