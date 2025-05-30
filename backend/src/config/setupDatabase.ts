import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function setupDatabase() {
  console.log('Aguardando PostgreSQL inicializar...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'maintenance_system',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('Conexão com PostgreSQL estabelecida!');

    // 1. Executar script principal
    const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Estrutura do banco criada!');

    // 2. 🎯 NOVO: Executar script de dados demo
    const demoSql = fs.readFileSync(path.join(__dirname, 'demoData.sql'), 'utf8');
    await pool.query(demoSql);
    console.log('✅ Função de dados demo instalada!');

  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();