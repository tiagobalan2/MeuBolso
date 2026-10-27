import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida no .env');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Testa a conexão ao iniciar
pool.query('SELECT NOW()')
  .then(() => console.log('🐘 Conectado ao PostgreSQL (MeuBolso)'))
  .catch((err) => {
    console.error('❌ Erro ao conectar no PostgreSQL:', err.message);
    process.exit(1);
  });

// Helper para queries
export const query = (text, params) => pool.query(text, params);