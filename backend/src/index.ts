// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';
import maintenanceTypeRoutes from './routes/maintenanceTypeRoutes';
import maintenanceRecordRoutes from './routes/maintenanceRecordRoutes';
import maintenanceScheduleRoutes from './routes/maintenanceScheduleRoutes';
import db from './config/db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/maintenance-types', maintenanceTypeRoutes);
app.use('/api/maintenance-records', maintenanceRecordRoutes);
app.use('/api/maintenance-schedules', maintenanceScheduleRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API do Sistema de Manutenção de Ativos' });
});

// Rota de health check
app.get('/health', async (req, res) => {
  try {
    // Testar conexão com banco
    await db.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Função para aguardar o banco de dados estar pronto
async function waitForDatabase(maxRetries = 30, delay = 1000) {
  console.log('Aguardando conexão com o banco de dados...');

  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.query('SELECT NOW()');
      console.log('✅ Conexão com o banco de dados estabelecida!');
      return true;
    } catch (error) {
      console.log(`Tentativa ${i + 1}/${maxRetries}: Banco de dados ainda não está pronto...`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Não foi possível conectar ao banco de dados');
}

// Iniciar servidor apenas após o banco estar pronto
async function startServer() {
  try {
    // Aguardar o banco de dados apenas se estivermos em produção ou Docker
    if (process.env.NODE_ENV === 'production' || process.env.DB_HOST === 'postgres') {
      await waitForDatabase();
    }

    app.listen(port, () => {
      console.log(`🚀 Servidor rodando na porta ${port}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
      console.log(`📍 APIs disponíveis:`);
      console.log(`   - Auth: http://localhost:${port}/api/auth`);
      console.log(`   - Assets: http://localhost:${port}/api/assets`);
      console.log(`   - Maintenance Types: http://localhost:${port}/api/maintenance-types`);
      console.log(`   - Maintenance Records: http://localhost:${port}/api/maintenance-records`);
      console.log(`   - Maintenance Schedules: http://localhost:${port}/api/maintenance-schedules`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();