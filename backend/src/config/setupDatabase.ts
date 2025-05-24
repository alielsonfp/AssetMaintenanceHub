import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function setupDatabase() {
  // Aguardar um pouco para garantir que o PostgreSQL está pronto
  console.log('Aguardando PostgreSQL inicializar...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Criar um novo pool específico para a configuração
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'maintenance_system',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    // Testar conexão primeiro
    await pool.query('SELECT NOW()');
    console.log('Conexão com PostgreSQL estabelecida!');

    // Ler o arquivo SQL
    const sql = fs.readFileSync(
      path.join(__dirname, 'database.sql'),
      'utf8'
    );

    // Executar o script SQL
    await pool.query(sql);
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    process.exit(1);
  } finally {
    // Fechar a conexão
    await pool.end();
  }
}

// Executar a função
setupDatabase();