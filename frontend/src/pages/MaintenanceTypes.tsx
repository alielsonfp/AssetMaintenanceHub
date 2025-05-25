// frontend/src/pages/MaintenanceTypes.tsx
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
  FormControlLabel,
  Switch,
  CircularProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { Add, Edit, Delete, Build, Star, StarBorder } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { MaintenanceType, CreateMaintenanceTypeData, UpdateMaintenanceTypeData } from '../types';
import { maintenanceTypeService } from '../services/api';

const MaintenanceTypes: React.FC = () => {
  const { t } = useTranslation();

  // Estados
  const [types, setTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<MaintenanceType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<any>(null);

  // Form data
  const [formData, setFormData] = useState<CreateMaintenanceTypeData>({
    name: '',
    description: '',
    is_default: false
  });

  // Carregar tipos de manutenção
  const loadMaintenanceTypes = async () => {
    try {
      setLoading(true);
      const [typesResponse, statsResponse] = await Promise.all([
        maintenanceTypeService.getAll(),
        maintenanceTypeService.getStats()
      ]);
      setTypes(typesResponse.maintenanceTypes);
      setStats(statsResponse.stats);
      setError('');
    } catch (error: any) {
      console.error('Erro ao carregar tipos de manutenção:', error);
      setError('Erro ao carregar tipos de manutenção');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na montagem
  useEffect(() => {
    loadMaintenanceTypes();
  }, []);

  // Handlers do formulário
  const handleAddType = () => {
    setEditingType(null);
    setFormData({ name: '', description: '', is_default: false });
    setFormOpen(true);
  };

  const handleEditType = (type: MaintenanceType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      is_default: type.is_default
    });
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingType(null);
    setFormData({ name: '', description: '', is_default: false });
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
        is_default: formData.is_default
      };

      if (editingType) {
        await maintenanceTypeService.update(editingType.id!, submitData);
        setSuccess('Tipo de manutenção atualizado com sucesso!');
      } else {
        await maintenanceTypeService.create(submitData);
        setSuccess('Tipo de manutenção criado com sucesso!');
      }

      await loadMaintenanceTypes();
      handleFormClose();
    } catch (error: any) {
      console.error('Erro ao salvar tipo:', error);
      setError(error.response?.data?.message || 'Erro ao salvar tipo de manutenção');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type: MaintenanceType) => {
    if (type.is_default) {
      setError('Tipos de manutenção padrão não podem ser removidos');
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover "${type.name}"?`)) {
      try {
        await maintenanceTypeService.delete(type.id!);
        setSuccess('Tipo de manutenção removido com sucesso!');
        await loadMaintenanceTypes();
      } catch (error: any) {
        console.error('Erro ao deletar tipo:', error);
        setError(error.response?.data?.message || 'Erro ao remover tipo de manutenção');
      }
    }
  };

  const handleCreateDefaults = async () => {
    try {
      setSubmitting(true);
      await maintenanceTypeService.createDefaults();
      setSuccess('Tipos de manutenção padrão criados com sucesso!');
      await loadMaintenanceTypes();
    } catch (error: any) {
      console.error('Erro ao criar tipos padrão:', error);
      setError(error.response?.data?.message || 'Erro ao criar tipos padrão');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {t('maintenance.types.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Gerencie os tipos de manutenção para seus ativos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {stats && stats.total === 0 && (
            <Button
              variant="outlined"
              startIcon={<Star />}
              onClick={handleCreateDefaults}
              disabled={submitting}
            >
              Criar Tipos Padrão
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddType}
            size="large"
          >
            {t('maintenance.types.add')}
          </Button>
        </Box>
      </Box>

      {/* Estatísticas */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total de Tipos
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Tipos Padrão
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                  {stats.defaults}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Tipos Customizados
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                  {stats.custom}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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

      {/* Tabela de Tipos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nome</strong></TableCell>
              <TableCell><strong>Descrição</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Criado em</strong></TableCell>
              <TableCell><strong>Ações</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : types.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Nenhum tipo de manutenção cadastrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Comece criando tipos padrão ou adicione seus próprios tipos
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Star />}
                      onClick={handleCreateDefaults}
                      disabled={submitting}
                    >
                      Criar Tipos Padrão
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.is_default ? <Star color="primary" /> : <StarBorder />}
                      {type.name}
                    </Box>
                  </TableCell>
                  <TableCell>{type.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={type.is_default ? 'Padrão' : 'Customizado'}
                      color={type.is_default ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(type.created_at!)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditType(type)} color="primary">
                      <Edit />
                    </IconButton>
                    {!type.is_default && (
                      <IconButton onClick={() => handleDelete(type)} color="error">
                        <Delete />
                      </IconButton>
                    )}
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
            {editingType ? t('maintenance.types.edit') : t('maintenance.types.add')}
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
                placeholder="Ex: Troca de óleo"
              />

              <TextField
                label="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
                disabled={submitting}
                placeholder="Descreva este tipo de manutenção..."
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    disabled={submitting}
                  />
                }
                label="Tipo padrão"
              />
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

export default MaintenanceTypes;