// backend/src/controllers/assetsController.ts
import { Request, Response } from 'express';
import assetModel, { CreateAssetData, UpdateAssetData } from '../models/assetModel';

const assetsController = {
  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const assets = await assetModel.findAllByUserId(userId);

      return res.json({
        assets,
        total: assets.length
      });
    } catch (error) {
      console.error('Erro ao buscar ativos:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const assetId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(assetId)) {
        return res.status(400).json({ message: 'ID do ativo inválido' });
      }

      const asset = await assetModel.findById(assetId, userId);

      if (!asset) {
        return res.status(404).json({ message: 'Ativo não encontrado' });
      }

      return res.json({ asset });
    } catch (error) {
      console.error('Erro ao buscar ativo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { name, description, location, status }: CreateAssetData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Nome do ativo é obrigatório' });
      }

      // Validar status se fornecido
      if (status && !['active', 'inactive', 'maintenance'].includes(status)) {
        return res.status(400).json({
          message: 'Status deve ser: active, inactive ou maintenance'
        });
      }

      const assetData: CreateAssetData = {
        name: name.trim(),
        description: description?.trim(),
        location: location?.trim(),
        status: status || 'active'
      };

      const asset = await assetModel.create(userId, assetData);

      return res.status(201).json({
        message: 'Ativo criado com sucesso',
        asset
      });
    } catch (error) {
      console.error('Erro ao criar ativo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const assetId = parseInt(req.params.id);
      const { name, description, location, status }: UpdateAssetData = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(assetId)) {
        return res.status(400).json({ message: 'ID do ativo inválido' });
      }

      // Verificar se o ativo existe e pertence ao usuário
      const existingAsset = await assetModel.findById(assetId, userId);
      if (!existingAsset) {
        return res.status(404).json({ message: 'Ativo não encontrado' });
      }

      // Validar campos se fornecidos
      if (name !== undefined && name.trim().length === 0) {
        return res.status(400).json({ message: 'Nome do ativo não pode estar vazio' });
      }

      if (status && !['active', 'inactive', 'maintenance'].includes(status)) {
        return res.status(400).json({
          message: 'Status deve ser: active, inactive ou maintenance'
        });
      }

      const updateData: UpdateAssetData = {};

      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim();
      if (location !== undefined) updateData.location = location?.trim();
      if (status !== undefined) updateData.status = status;

      const updatedAsset = await assetModel.update(assetId, userId, updateData);

      return res.json({
        message: 'Ativo atualizado com sucesso',
        asset: updatedAsset
      });
    } catch (error) {
      console.error('Erro ao atualizar ativo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const assetId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      if (isNaN(assetId)) {
        return res.status(400).json({ message: 'ID do ativo inválido' });
      }

      // Verificar se o ativo existe e pertence ao usuário
      const existingAsset = await assetModel.findById(assetId, userId);
      if (!existingAsset) {
        return res.status(404).json({ message: 'Ativo não encontrado' });
      }

      const deleted = await assetModel.delete(assetId, userId);

      if (!deleted) {
        return res.status(500).json({ message: 'Erro ao deletar ativo' });
      }

      return res.json({
        message: 'Ativo removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar ativo:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const stats = await assetModel.getAssetStats(userId);

      return res.json({
        stats: {
          total: parseInt(stats.total),
          active: parseInt(stats.active),
          inactive: parseInt(stats.inactive),
          maintenance: parseInt(stats.maintenance)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
};

export default assetsController;