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
import { assetService } from '../services/api';
import type { AssetStats } from '../types';

// Tipos para os dados do dashboard
interface MaintenanceItem {
  id: number;
  assetName: string;
  type: string;
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'today';
  daysUntil: number;
}

interface DashboardStats {
  assets: AssetStats;
  maintenances: {
    upcoming: number;
    overdue: number;
    thisWeek: number;
    thisMonth: number;
  };
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  // Estados
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcomingMaintenances, setUpcomingMaintenances] = useState<MaintenanceItem[]>([]);

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar estatísticas de ativos
      const assetStatsResponse = await assetService.getStats();

      // Por enquanto, dados de manutenção simulados (será substituído pela API real)
      const mockMaintenances: MaintenanceItem[] = [
        {
          id: 1,
          assetName: "Meu Carro - Gol",
          type: "Troca de óleo",
          dueDate: "2025-05-26",
          status: "upcoming",
          daysUntil: 2
        },
        {
          id: 2,
          assetName: "Prensa Hidráulica",
          type: "Lubrificação geral",
          dueDate: "2025-05-24",
          status: "today",
          daysUntil: 0
        },
        {
          id: 3,
          assetName: "Servidor Principal",
          type: "Limpeza e verificação",
          dueDate: "2025-05-22",
          status: "overdue",
          daysUntil: -2
        },
        {
          id: 4,
          assetName: "Ar Condicionado",
          type: "Troca de filtros",
          dueDate: "2025-05-28",
          status: "upcoming",
          daysUntil: 4
        }
      ];

      setStats({
        assets: assetStatsResponse.stats,
        maintenances: {
          upcoming: mockMaintenances.filter(m => m.status === 'upcoming').length,
          overdue: mockMaintenances.filter(m => m.status === 'overdue').length,
          thisWeek: mockMaintenances.filter(m => m.daysUntil <= 7 && m.daysUntil >= 0).length,
          thisMonth: mockMaintenances.length
        }
      });

      setUpcomingMaintenances(mockMaintenances);
      setError('');
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Dados para gráficos
  const assetsPieData = stats ? [
    { name: 'Ativos', value: stats.assets.active, color: '#4caf50' },
    { name: 'Inativos', value: stats.assets.inactive, color: '#9e9e9e' },
    { name: 'Manutenção', value: stats.assets.maintenance, color: '#ff9800' }
  ] : [];

  const maintenanceTrendData = [
    { month: 'Jan', realizadas: 12, previstas: 15 },
    { month: 'Fev', realizadas: 19, previstas: 18 },
    { month: 'Mar', realizadas: 8, previstas: 12 },
    { month: 'Abr', realizadas: 15, previstas: 20 },
    { month: 'Mai', realizadas: 7, previstas: 14 }
  ];

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
  const MaintenanceItem: React.FC<{ maintenance: MaintenanceItem }> = ({ maintenance }) => {
    const getStatusInfo = (status: string, daysUntil: number) => {
      switch (status) {
        case 'overdue':
          return { color: 'error', text: `${Math.abs(daysUntil)} dias atrasada`, icon: <Error /> };
        case 'today':
          return { color: 'warning', text: 'Vence hoje', icon: <Warning /> };
        case 'upcoming':
          return { color: 'info', text: `${daysUntil} dias restantes`, icon: <Schedule /> };
        default:
          return { color: 'default', text: 'Pendente', icon: <Schedule /> };
      }
    };

    const statusInfo = getStatusInfo(maintenance.status, maintenance.daysUntil);

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
          primary={maintenance.assetName}
          secondary={
            <>
              {maintenance.type}
              <br />
              <Typography component="span" variant="caption" color="text.secondary">
                Vencimento: {new Date(maintenance.dueDate).toLocaleDateString('pt-BR')}
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
            Bem-vindo de volta! Aqui está um resumo dos seus ativos e manutenções.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate('/maintenance')}
          >
            Ver Manutenções
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/assets')}
          >
            Adicionar Ativo
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
            title="Total de Ativos"
            value={stats?.assets.total || 0}
            icon={<DirectionsCar />}
            color={theme.palette.primary.main}
            subtitle="Equipamentos cadastrados"
            growth={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ativos Ativos"
            value={stats?.assets.active || 0}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
            subtitle="Em operação normal"
            growth={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Manutenções Próximas"
            value={stats?.maintenances.upcoming || 0}
            icon={<Schedule />}
            color={theme.palette.warning.main}
            subtitle="Próximos 7 dias"
            growth={-8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Manutenções Atrasadas"
            value={stats?.maintenances.overdue || 0}
            icon={<Error />}
            color={theme.palette.error.main}
            subtitle="Requer atenção imediata"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Próximas Manutenções */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" fontWeight="bold">
                  Próximas Manutenções
                </Typography>
                <Chip
                  label={`${upcomingMaintenances.length} pendentes`}
                  color="primary"
                  size="small"
                />
              </Box>

              {upcomingMaintenances.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Todas as manutenções estão em dia!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma manutenção programada para os próximos dias.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {upcomingMaintenances.map((maintenance) => (
                    <MaintenanceItem key={maintenance.id} maintenance={maintenance} />
                  ))}
                </List>
              )}

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/maintenance')}
                  startIcon={<Build />}
                >
                  Ver Todas as Manutenções
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
                Distribuição de Ativos
              </Typography>

              {stats?.assets.total === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DirectionsCar sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Nenhum ativo cadastrado ainda
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/assets')}
                  >
                    Adicionar Primeiro Ativo
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
                Tendência de Manutenções
              </Typography>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={maintenanceTrendData}>
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
                    name="Realizadas"
                  />
                  <Line
                    type="monotone"
                    dataKey="previstas"
                    stroke={theme.palette.secondary.main}
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="Previstas"
                  />
                </LineChart>
              </ResponsiveContainer>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Acompanhe o desempenho das suas manutenções ao longo do tempo
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