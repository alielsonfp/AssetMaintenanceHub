import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Em vez de criar o pool imediatamente, crie uma função para obter o pool
let pool: Pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'maintenance_system',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    });
  }
  return pool;
}

export default {
  query: async (text: string, params?: any[]) => {
    const client = await getPool().connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  },
  getClient: () => getPool().connect(),
};