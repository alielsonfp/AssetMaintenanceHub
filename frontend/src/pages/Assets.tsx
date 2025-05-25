// frontend/src/pages/Assets.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Asset, CreateAssetData, UpdateAssetData } from '../types';
import { assetService } from '../services/api';


const Assets: React.FC = () => {
  const { t } = useTranslation();

  // Estados
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState<CreateAssetData>({
    name: '',
    description: '',
    location: '',
    status: 'active'
  });

  // Carregar ativos
  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await assetService.getAll();
      setAssets(response.assets);
      setError('');
    } catch (error: any) {
      console.error('Erro ao carregar ativos:', error);
      setError('Erro ao carregar ativos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar ativos na montagem
  useEffect(() => {
    loadAssets();
  }, []);

  // Handlers do formulário
  const handleAddAsset = () => {
    setEditingAsset(null);
    setFormData({ name: '', description: '', location: '', status: 'active' });
    setFormOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description || '',
      location: asset.location || '',
      status: asset.status
    });
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingAsset(null);
    setFormData({ name: '', description: '', location: '', status: 'active' });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const submitData = {
        name: formData.name.trim(),
        ...(formData.description && { description: formData.description.trim() }),
        ...(formData.location && { location: formData.location.trim() }),
        status: formData.status
      };

      if (editingAsset) {
        await assetService.update(editingAsset.id, submitData);
        setSuccess('Ativo atualizado com sucesso!');
      } else {
        await assetService.create(submitData);
        setSuccess('Ativo criado com sucesso!');
      }

      await loadAssets();
      handleFormClose();
    } catch (error: any) {
      console.error('Erro ao salvar ativo:', error);
      setError(error.response?.data?.message || 'Erro ao salvar ativo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (window.confirm(`Tem certeza que deseja remover "${asset.name}"?`)) {
      try {
        await assetService.delete(asset.id);
        setSuccess('Ativo removido com sucesso!');
        await loadAssets();
      } catch (error: any) {
        console.error('Erro ao deletar ativo:', error);
        setError(error.response?.data?.message || 'Erro ao remover ativo');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {t('assets.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddAsset}
          size="large"
        >
          {t('assets.add')}
        </Button>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabela de Ativos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell><strong>Descrição</strong></TableCell>
              <TableCell><strong>Localização</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Criado em</strong></TableCell>
              <TableCell><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  {t('assets.noAssets')}
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.description || '-'}</TableCell>
                  <TableCell>{asset.location || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(`assets.status.${asset.status}`)}
                      color={getStatusColor(asset.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(asset.created_at)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditAsset(asset)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(asset)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog do Formulário */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            {editingAsset ? t('assets.edit') : t('assets.add')}
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Nome *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                disabled={submitting}
              />

              <TextField
                label="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
                disabled={submitting}
              />

              <TextField
                label="Localização"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                fullWidth
                disabled={submitting}
              />

              <FormControl fullWidth disabled={submitting}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  label="Status"
                >
                  <MenuItem value="active">{t('assets.status.active')}</MenuItem>
                  <MenuItem value="inactive">{t('assets.status.inactive')}</MenuItem>
                  <MenuItem value="maintenance">{t('assets.status.maintenance')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleFormClose} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? t('common.loading') : t('common.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Assets;