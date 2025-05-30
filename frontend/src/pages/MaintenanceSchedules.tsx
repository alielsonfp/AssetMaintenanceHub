// frontend/src/pages/MaintenanceSchedules.tsx
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
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add, Edit, Delete, Schedule, CheckCircle, Warning, Error,
  Event, Autorenew, TrendingUp, CalendarToday
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type {
  MaintenanceSchedule,
  CreateMaintenanceScheduleData,
  UpdateMaintenanceScheduleData,
  Asset,
  MaintenanceType
} from '../types';
import { maintenanceScheduleService, assetService, maintenanceTypeService } from '../services/api';

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

const MaintenanceSchedules: React.FC = () => {
  const { t } = useTranslation();

  // Estados
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<MaintenanceSchedule[]>([]);
  const [overdueSchedules, setOverdueSchedules] = useState<MaintenanceSchedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);

  // Form data
  const [formData, setFormData] = useState<CreateMaintenanceScheduleData>({
    asset_id: 0,
    maintenance_type_id: undefined,
    frequency_type: 'months',
    frequency_value: 1,
    scheduled_date: undefined
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const [
        schedulesResponse,
        upcomingResponse,
        overdueResponse,
        assetsResponse,
        typesResponse,
        statsResponse
      ] = await Promise.all([
        maintenanceScheduleService.getAll(),
        maintenanceScheduleService.getUpcoming(7),
        maintenanceScheduleService.getOverdue(),
        assetService.getAll(),
        maintenanceTypeService.getAll(),
        maintenanceScheduleService.getStats()
      ]);

      setSchedules(schedulesResponse.schedules);
      setUpcomingSchedules(upcomingResponse.schedules);
      setOverdueSchedules(overdueResponse.schedules);
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

  // Handlers do formulário
  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      asset_id: 0,
      maintenance_type_id: undefined,
      frequency_type: 'months',
      frequency_value: 1,
      scheduled_date: undefined
    });
    setFormOpen(true);
  };

  const handleEditSchedule = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      asset_id: schedule.asset_id,
      maintenance_type_id: schedule.maintenance_type_id,
      frequency_type: schedule.frequency_type,
      frequency_value: schedule.frequency_value,
      scheduled_date: schedule.scheduled_date
    });
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingSchedule(null);
    setFormData({
      asset_id: 0,
      maintenance_type_id: undefined,
      frequency_type: 'months',
      frequency_value: 1,
      scheduled_date: undefined
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.asset_id) {
      setError('Ativo é obrigatório');
      return;
    }

    if (!formData.frequency_value || formData.frequency_value <= 0) {
      setError('Valor da frequência deve ser maior que zero');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const submitData = {
        asset_id: formData.asset_id,
        maintenance_type_id: formData.maintenance_type_id || undefined,
        frequency_type: formData.frequency_type,
        frequency_value: formData.frequency_value,
        scheduled_date: formData.scheduled_date || undefined
      };

      if (editingSchedule) {
        await maintenanceScheduleService.update(editingSchedule.id!, submitData);
        setSuccess('Agendamento atualizado com sucesso!');
      } else {
        await maintenanceScheduleService.create(submitData);
        setSuccess('Agendamento criado com sucesso!');
      }

      await loadData();
      handleFormClose();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      setError(error.response?.data?.message || 'Erro ao salvar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (schedule: MaintenanceSchedule) => {
    if (window.confirm(`Tem certeza que deseja remover este agendamento?`)) {
      try {
        await maintenanceScheduleService.delete(schedule.id!);
        setSuccess('Agendamento removido com sucesso!');
        await loadData();
      } catch (error: any) {
        console.error('Erro ao deletar agendamento:', error);
        setError(error.response?.data?.message || 'Erro ao remover agendamento');
      }
    }
  };

  const getStatusInfo = (status: string, scheduledDate: string) => {
    const today = new Date();
    const scheduled = new Date(scheduledDate);
    const diffTime = scheduled.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (status) {
      case 'overdue':
        return {
          color: 'error',
          text: `${Math.abs(diffDays)} dias atrasada`,
          icon: <Error />
        };
      case 'completed':
        return {
          color: 'success',
          text: 'Concluída',
          icon: <CheckCircle />
        };
      case 'pending':
        if (diffDays === 0) {
          return {
            color: 'warning',
            text: 'Vence hoje',
            icon: <Warning />
          };
        } else if (diffDays > 0) {
          return {
            color: 'info',
            text: `${diffDays} dias restantes`,
            icon: <Schedule />
          };
        } else {
          return {
            color: 'error',
            text: `${Math.abs(diffDays)} dias atrasada`,
            icon: <Error />
          };
        }
      default:
        return {
          color: 'default',
          text: 'Pendente',
          icon: <Schedule />
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatFrequency = (type: string, value: number) => {
    const types: { [key: string]: string } = {
      days: 'dia(s)',
      weeks: 'semana(s)',
      months: 'mês(es)',
      kilometers: 'km',
      hours: 'hora(s)'
    };
    return `${value} ${types[type] || type}`;
  };

  // Componente para item de agendamento próximo/atrasado
  const ScheduleItem: React.FC<{ schedule: MaintenanceSchedule }> = ({ schedule }) => {
    const statusInfo = getStatusInfo(schedule.status, schedule.scheduled_date);

    return (
      <ListItem
        sx={{
          border: `1px solid ${statusInfo.color === 'error' ? 'error.main' : 'divider'}`,
          borderRadius: 2,
          mb: 1,
          bgcolor: 'background.paper'
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: `${statusInfo.color}.main` }}>
            {statusInfo.icon}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={schedule.asset_name}
          secondary={
            <>
              {schedule.maintenance_type_name || 'Manutenção geral'}
              <br />
              <Typography component="span" variant="caption" color="text.secondary">
                Agendado para: {formatDate(schedule.scheduled_date)}
              </Typography>
            </>
          }
          primaryTypographyProps={{
            variant: 'subtitle2',
            fontWeight: 'medium'
          }}
          secondaryTypographyProps={{
            variant: 'body2',
            color: 'text.secondary',
            component: 'span'
          }}
        />
        <ListItemSecondaryAction>
          <Chip
            label={statusInfo.text}
            color={statusInfo.color as any}
            size="small"
            variant="outlined"
          />
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Agendamentos de Manutenção
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Gerencie e acompanhe as manutenções programadas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddSchedule}
          size="large"
        >
          Novo Agendamento
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Visão Geral" />
          <Tab label="Todos os Agendamentos" />
          <Tab label="Estatísticas" />
        </Tabs>
      </Box>

      {/* Tab Panel - Visão Geral */}
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

        <Grid container spacing={3}>
          {/* Manutenções Atrasadas
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Error color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Manutenções Atrasadas
                  </Typography>
                  <Chip
                    label={overdueSchedules.length}
                    color="error"
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                </Box>

                {loading ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : overdueSchedules.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma manutenção atrasada!
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {overdueSchedules.map((schedule) => (
                      <ScheduleItem key={schedule.id} schedule={schedule} />
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid> */}

          {/* Próximas Manutenções */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Próximas Manutenções (7 dias)
                  </Typography>
                  <Chip
                    label={upcomingSchedules.length}
                    color="warning"
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                </Box>

                {loading ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : upcomingSchedules.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Event sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma manutenção próxima
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {upcomingSchedules.map((schedule) => (
                      <ScheduleItem key={schedule.id} schedule={schedule} />
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab Panel - Todos os Agendamentos */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Ativo</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Data Agendada</strong></TableCell>
                <TableCell><strong>Frequência</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
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
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Nenhum agendamento encontrado
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Comece criando seu primeiro agendamento
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => {
                  const statusInfo = getStatusInfo(schedule.status, schedule.scheduled_date);
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.asset_name}</TableCell>
                      <TableCell>
                        {schedule.maintenance_type_name ? (
                          <Chip label={schedule.maintenance_type_name} size="small" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(schedule.scheduled_date)}</TableCell>
                      <TableCell>
                        {formatFrequency(schedule.frequency_type, schedule.frequency_value)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusInfo.text}
                          color={statusInfo.color as any}
                          size="small"
                          icon={statusInfo.icon}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditSchedule(schedule)} color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(schedule)} color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab Panel - Estatísticas */}
      <TabPanel value={tabValue} index={2}>
        {stats && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total de Agendamentos
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.totalSchedules}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Pendentes
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="warning.main">
                    {stats.pending}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Concluídos
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                    {stats.completed}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Atrasados
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="error.main">
                    {stats.overdue}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Próxima Semana
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.upcomingWeek}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Próximo Mês
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stats.upcomingMonth}
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
            {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
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
                  <MenuItem value="">Manutenção geral</MenuItem>
                  {maintenanceTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    label="Valor da Frequência *"
                    type="number"
                    value={formData.frequency_value}
                    onChange={(e) => setFormData({ ...formData, frequency_value: Number(e.target.value) })}
                    fullWidth
                    required
                    disabled={submitting}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth required disabled={submitting}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={formData.frequency_type}
                      onChange={(e) => setFormData({ ...formData, frequency_type: e.target.value as any })}
                      label="Tipo"
                    >
                      <MenuItem value="days">Dias</MenuItem>
                      <MenuItem value="weeks">Semanas</MenuItem>
                      <MenuItem value="months">Meses</MenuItem>
                      <MenuItem value="kilometers">Km</MenuItem>
                      <MenuItem value="hours">Horas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                label="Data Específica (opcional)"
                type="date"
                value={formData.scheduled_date || ''}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value || undefined })}
                fullWidth
                disabled={submitting}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Se não informado, será calculado automaticamente"
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleFormClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MaintenanceSchedules;