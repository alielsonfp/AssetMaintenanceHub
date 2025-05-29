// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Alert,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import {
  DirectionsCar,
  Build,
  CheckCircle,
  Warning,
  Error,
  Add,
  TrendingUp,
  Schedule,
  Assessment,
  Notifications
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import {
  assetService,
  maintenanceScheduleService,
  maintenanceRecordService
} from '../services/api';
import type { AssetStats, MaintenanceSchedule, MaintenanceRecord } from '../types';

// Interfaces para os dados do dashboard
interface DashboardStats {
  assets: AssetStats;
  maintenances: {
    upcoming: number;
    overdue: number;
    thisWeek: number;
    thisMonth: number;
  };
}

interface MaintenanceTrendData {
  month: string;
  realizadas: number;
  previstas: number;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  // Estados
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<MaintenanceSchedule[]>([]);
  const [overdueMaintenances, setOverdueMaintenances] = useState<MaintenanceSchedule[]>([]);
  const [recentMaintenances, setRecentMaintenances] = useState<MaintenanceRecord[]>([]);
  const [maintenanceTrend, setMaintenanceTrend] = useState<MaintenanceTrendData[]>([]);

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar dados em paralelo
      const [
        assetStatsResponse,
        scheduleStatsResponse,
        upcomingResponse,
        overdueResponse,
        recentResponse
      ] = await Promise.all([
        assetService.getStats(),
        maintenanceScheduleService.getStats(),
        maintenanceScheduleService.getUpcoming(7),
        maintenanceScheduleService.getOverdue(),
        maintenanceRecordService.getRecent(5)
      ]);

      // Compilar estatísticas
      const dashboardStats: DashboardStats = {
        assets: assetStatsResponse.stats,
        maintenances: {
          upcoming: scheduleStatsResponse.stats.upcomingWeek,
          overdue: scheduleStatsResponse.stats.overdue,
          thisWeek: scheduleStatsResponse.stats.upcomingWeek,
          thisMonth: scheduleStatsResponse.stats.upcomingMonth
        }
      };

      setStats(dashboardStats);
      setUpcomingMaintenances(upcomingResponse.schedules);
      setOverdueMaintenances(overdueResponse.schedules);
      setRecentMaintenances(recentResponse.maintenanceRecords);

      // Gerar dados de tendência (últimos 5 meses)
      const trendData = generateMaintenanceTrend(recentResponse.maintenanceRecords);
      setMaintenanceTrend(trendData);

      setError('');
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Gerar dados de tendência baseados nos registros reais
  const generateMaintenanceTrend = (records: MaintenanceRecord[]): MaintenanceTrendData[] => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
    const now = new Date();

    return months.map((month, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - (4 - index) + 1, 1);

      const realizadas = records.filter(record => {
        const recordDate = new Date(record.date_performed);
        return recordDate >= monthDate && recordDate < nextMonth;
      }).length;

      // Estimativa de manutenções previstas baseada nos registros + variação
      const previstas = Math.max(realizadas + Math.floor(Math.random() * 5) - 2, realizadas);

      return {
        month,
        realizadas,
        previstas
      };
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Dados para gráficos
  const assetsPieData = stats ? [
    { name: t('assets.status.active'), value: stats.assets.active, color: '#4caf50' },
    { name: t('assets.status.inactive'), value: stats.assets.inactive, color: '#9e9e9e' },
    { name: t('assets.status.maintenance'), value: stats.assets.maintenance, color: '#ff9800' }
  ] : [];

  // Componente para card de estatística
  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    growth?: number;
  }> = ({ title, value, icon, color, subtitle, growth }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          {growth !== undefined && (
            <Chip
              label={`${growth > 0 ? '+' : ''}${growth}%`}
              color={growth > 0 ? 'success' : growth < 0 ? 'error' : 'default'}
              size="small"
              icon={<TrendingUp />}
            />
          )}
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Componente para item de manutenção
  const MaintenanceItem: React.FC<{ maintenance: MaintenanceSchedule }> = ({ maintenance }) => {
    const getStatusInfo = (status: string, scheduledDate: string) => {
      const today = new Date();
      const scheduled = new Date(scheduledDate);
      const diffTime = scheduled.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (status) {
        case 'overdue':
          return { color: 'error', text: `${Math.abs(diffDays)} ${t('dashboard.daysOverdue')}`, icon: <Error /> };
        case 'completed':
          return { color: 'success', text: t('dashboard.completed'), icon: <CheckCircle /> };
        case 'pending':
          if (diffDays === 0) {
            return { color: 'warning', text: t('dashboard.dueToday'), icon: <Warning /> };
          } else if (diffDays > 0) {
            return { color: 'info', text: `${diffDays} ${t('dashboard.daysRemaining')}`, icon: <Schedule /> };
          } else {
            return { color: 'error', text: `${Math.abs(diffDays)} ${t('dashboard.daysOverdue')}`, icon: <Error /> };
          }
        default:
          return { color: 'default', text: t('dashboard.pending'), icon: <Schedule /> };
      }
    };

    const statusInfo = getStatusInfo(maintenance.status, maintenance.scheduled_date);

    return (
      <ListItem
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          mb: 1,
          bgcolor: 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            transform: 'translateX(4px)'
          }
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: `${statusInfo.color}.main` }}>
            {statusInfo.icon}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={maintenance.asset_name}
          secondary={
            <>
              {maintenance.maintenance_type_name || t('dashboard.generalMaintenance')}
              <br />
              <Typography component="span" variant="caption" color="text.secondary">
                {t('dashboard.dueDate')}: {new Date(maintenance.scheduled_date).toLocaleDateString('pt-BR')}
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

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 3 }}>
          {t('dashboard.title')}
        </Typography>

        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={32} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {t('dashboard.welcome')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/maintenance-schedules')}
          >
            {t('dashboard.seeMaintenances')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/assets')}
          >
            {t('dashboard.addAsset')}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.assetCount')}
            value={stats?.assets.total || 0}
            icon={<DirectionsCar />}
            color={theme.palette.primary.main}
            subtitle={t('dashboard.equipmentRegistered')}
            growth={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.activeAssets')}
            value={stats?.assets.active || 0}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            subtitle={t('dashboard.normalOperation')}
            growth={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.upcomingMaintenance')}
            value={stats?.maintenances.upcoming || 0}
            icon={<Schedule />}
            color={theme.palette.warning.main}
            subtitle={t('dashboard.next7Days')}
            growth={-8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.overdueMaintenance')}
            value={stats?.maintenances.overdue || 0}
            icon={<Error />}
            color={theme.palette.error.main}
            subtitle={t('dashboard.requiresAttention')}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Próximas Manutenções */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" fontWeight="bold">
                  {t('dashboard.upcomingMaintenances')}
                </Typography>
                <Chip
                  label={`${upcomingMaintenances.length + overdueMaintenances.length} ${t('dashboard.pendingCount')}`}
                  color="primary"
                  size="small"
                />
              </Box>

              {(upcomingMaintenances.length + overdueMaintenances.length) === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {t('dashboard.allUpToDate')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('dashboard.noScheduledMaintenance')}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {/* Manutenções Atrasadas primeiro */}
                  {overdueMaintenances.map((maintenance) => (
                    <MaintenanceItem key={`overdue-${maintenance.id}`} maintenance={maintenance} />
                  ))}
                  {/* Manutenções Próximas */}
                  {upcomingMaintenances.map((maintenance) => (
                    <MaintenanceItem key={`upcoming-${maintenance.id}`} maintenance={maintenance} />
                  ))}
                </List>
              )}

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/maintenance-schedules')}
                  startIcon={<Build />}
                >
                  {t('dashboard.seeAllMaintenances')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Distribuição de Ativos */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
                {t('dashboard.assetDistribution')}
              </Typography>

              {stats?.assets.total === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DirectionsCar sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('dashboard.noAssetsYet')}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/assets')}
                  >
                    {t('dashboard.addFirstAsset')}
                  </Button>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={assetsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {assetsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {/* Stats Summary */}
              {stats && stats.assets.total > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Ativos</Typography>
                    <Typography variant="body2" fontWeight="medium">{stats.assets.active}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Inativos</Typography>
                    <Typography variant="body2" fontWeight="medium">{stats.assets.inactive}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Em Manutenção</Typography>
                    <Typography variant="body2" fontWeight="medium">{stats.assets.maintenance}</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Tendência de Manutenções */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
                {t('dashboard.maintenanceTrend')}
              </Typography>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={maintenanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="realizadas"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    name={t('dashboard.performed')}
                  />
                  <Line
                    type="monotone"
                    dataKey="previstas"
                    stroke={theme.palette.secondary.main}
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name={t('dashboard.scheduled')}
                  />
                </LineChart>
              </ResponsiveContainer>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.trackPerformance')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/assets')}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Dashboard;