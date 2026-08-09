const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cheguei_mae',
  password: 'postgres',
  port: 5432,
});

async function alterTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "cnhNumero" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "cnhValidade" DATE,
      ADD COLUMN IF NOT EXISTS banco VARCHAR(100),
      ADD COLUMN IF NOT EXISTS agencia VARCHAR(20),
      ADD COLUMN IF NOT EXISTS conta VARCHAR(20),
      ADD COLUMN IF NOT EXISTS pix VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "vagasManha" INTEGER DEFAULT 15,
      ADD COLUMN IF NOT EXISTS "vagasTarde" INTEGER DEFAULT 15,
      ADD COLUMN IF NOT EXISTS "vagasNoite" INTEGER DEFAULT 15,
      ADD COLUMN IF NOT EXISTS configuracoes JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('Colunas adicionadas com sucesso!');
  } catch (error) {
    console.error('Erro ao alterar tabela', error);
  } finally {
    client.release();
    pool.end();
  }
}

alterTable();
