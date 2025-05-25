// frontend/src/pages/MaintenanceRecords.tsx
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
  CircularProgress,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Edit, Delete, Build, AttachMoney, CalendarToday, Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { MaintenanceRecord, CreateMaintenanceRecordData, UpdateMaintenanceRecordData, Asset, MaintenanceType } from '../types';
import { maintenanceRecordService, assetService, maintenanceTypeService } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MaintenanceRecords: React.FC = () => {
  const { t } = useTranslation();

  // Estados
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Form data
  const [formData, setFormData] = useState<CreateMaintenanceRecordData>({
    asset_id: 0,
    maintenance_type_id: undefined,
    date_performed: new Date().toISOString().split('T')[0],
    notes: '',
    cost: undefined
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsResponse, assetsResponse, typesResponse, statsResponse] = await Promise.all([
        maintenanceRecordService.getAll(),
        assetService.getAll(),
        maintenanceTypeService.getAll(),
        maintenanceRecordService.getStats()
      ]);

      setRecords(recordsResponse.maintenanceRecords);
      setAssets(assetsResponse.assets);
      setMaintenanceTypes(typesResponse.maintenanceTypes);
      setStats(statsResponse.stats);
      setError('');
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na montagem
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar registros
  const filteredRecords = records.filter(record =>
    record.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.maintenance_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers do formulário
  const handleAddRecord = () => {
    setEditingRecord(null);
    setFormData({
      asset_id: 0,
      maintenance_type_id: undefined,
      date_performed: new Date().toISOString().split('T')[0],
      notes: '',
      cost: undefined
    });
    setFormOpen(true);
  };

  const handleEditRecord = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setFormData({
      asset_id: record.asset_id,
      maintenance_type_id: record.maintenance_type_id,
      date_performed: record.date_performed,
      notes: record.notes || '',
      cost: record.cost
    });
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingRecord(null);
    setFormData({
      asset_id: 0,
      maintenance_type_id: undefined,
      date_performed: new Date().toISOString().split('T')[0],
      notes: '',
      cost: undefined
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id) {
      setError('Ativo é obrigatório');
      return;
    }

    if (!formData.date_performed) {
      setError('Data é obrigatória');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const submitData = {
        asset_id: formData.asset_id,
        maintenance_type_id: formData.maintenance_type_id || undefined,
        date_performed: formData.date_performed,
        notes: formData.notes?.trim() || undefined,
        cost: formData.cost || undefined
      };

      if (editingRecord) {
        await maintenanceRecordService.update(editingRecord.id!, submitData);
        setSuccess('Registro de manutenção atualizado com sucesso!');
      } else {
        await maintenanceRecordService.create(submitData);
        setSuccess('Registro de manutenção criado com sucesso!');
      }

      await loadData();
      handleFormClose();
    } catch (error: any) {
      console.error('Erro ao salvar registro:', error);
      setError(error.response?.data?.message || 'Erro ao salvar registro de manutenção');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record: MaintenanceRecord) => {
    if (window.confirm(`Tem certeza que deseja remover este registro de manutenção?`)) {
      try {
        await maintenanceRecordService.delete(record.id!);
        setSuccess('Registro de manutenção removido com sucesso!');
        await loadData();
      } catch (error: any) {
        console.error('Erro ao deletar registro:', error);
        setError(error.response?.data?.message || 'Erro ao remover registro de manutenção');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {t('maintenance.records.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Registre e acompanhe todas as manutenções realizadas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddRecord}
          size="large"
        >
          {t('maintenance.records.add')}
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Registros" />
          <Tab label="Estatísticas" />
        </Tabs>
      </Box>

      {/* Tab Panel - Registros */}
      <TabPanel value={tabValue} index={0}>
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

        {/* Busca */}
        <TextField
          fullWidth
          placeholder="Buscar por ativo, tipo de manutenção ou observações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Tabela de Registros */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Ativo</strong></TableCell>
                <TableCell><strong>Tipo de Manutenção</strong></TableCell>
                <TableCell><strong>Data</strong></TableCell>
                <TableCell><strong>Custo</strong></TableCell>
                <TableCell><strong>Observações</strong></TableCell>
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
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Build sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {searchTerm ? 'Nenhum registro encontrado' : 'Nenhum registro de manutenção encontrado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'Tente ajustar os termos da busca' : 'Comece registrando sua primeira manutenção'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.asset_name}</TableCell>
                    <TableCell>
                      {record.maintenance_type_name ? (
                        <Chip label={record.maintenance_type_name} size="small" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(record.date_performed)}</TableCell>
                    <TableCell>
                      {record.cost ? formatCurrency(record.cost) : '-'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditRecord(record)} color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(record)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab Panel - Estatísticas */}
      <TabPanel value={tabValue} index={1}>
        {stats && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total de Registros
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.totalRecords}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Ativos com Manutenção
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.assetsWithMaintenance}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Custo Total
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {formatCurrency(stats.totalCost)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Custo Médio
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {formatCurrency(stats.averageCost)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Últimos 30 Dias
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.last30Days}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    manutenções realizadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Últimos 90 Dias
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.last90Days}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    manutenções realizadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Dialog do Formulário */}
      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>
            {editingRecord ? t('maintenance.records.edit') : t('maintenance.records.add')}
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth required disabled={submitting}>
                <InputLabel>Ativo</InputLabel>
                <Select
                  value={formData.asset_id}
                  onChange={(e) => setFormData({ ...formData, asset_id: Number(e.target.value) })}
                  label="Ativo"
                >
                  <MenuItem value={0}>Selecione um ativo</MenuItem>
                  {assets.map((asset) => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={submitting}>
                <InputLabel>Tipo de Manutenção</InputLabel>
                <Select
                  value={formData.maintenance_type_id || ''}
                  onChange={(e) => setFormData({ ...formData, maintenance_type_id: Number(e.target.value) || undefined })}
                  label="Tipo de Manutenção"
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {maintenanceTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Data da Manutenção *"
                type="date"
                value={formData.date_performed}
                onChange={(e) => setFormData({ ...formData, date_performed: e.target.value })}
                fullWidth
                required
                disabled={submitting}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                label="Custo"
                type="number"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) || undefined })}
                fullWidth
                disabled={submitting}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                placeholder="0,00"
              />

              <TextField
                label="Observações"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={4}
                fullWidth
                disabled={submitting}
                placeholder="Descreva os detalhes da manutenção realizada..."
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

export default MaintenanceRecords;