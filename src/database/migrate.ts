import pool from '../config/database';

// ─────────────────────────────────────────────────────────────
// Trigger function para auto-atualizar updatedAt no PostgreSQL
// (equivalente ao ON UPDATE CURRENT_TIMESTAMP do MySQL)
// ─────────────────────────────────────────────────────────────
const triggerFunction = `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';
`;

const migrations = [
  // Tabela de usuários
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'motorista', 'responsavel', 'aluno')),
    telefone VARCHAR(20),
    cpf VARCHAR(14),
    "motoristaId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    "tenantId" INTEGER,
    "statusOnline" BOOLEAN NOT NULL DEFAULT FALSE,
    "lastHeartbeat" TIMESTAMP NULL DEFAULT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_tenant ON users ("tenantId")`,
  `CREATE INDEX IF NOT EXISTS idx_users_motorista ON users ("motoristaId")`,
  `CREATE INDEX IF NOT EXISTS idx_users_motorista_online ON users ("statusOnline", role)`,

  // Trigger updatedAt para users
  `DROP TRIGGER IF EXISTS users_updated_at ON users`,
  `CREATE TRIGGER users_updated_at
     BEFORE UPDATE ON users
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de escolas
  `CREATE TABLE IF NOT EXISTS escolas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(500) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_escolas_tenant ON escolas ("tenantId")`,
  `DROP TRIGGER IF EXISTS escolas_updated_at ON escolas`,
  `CREATE TRIGGER escolas_updated_at
     BEFORE UPDATE ON escolas
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de endereços
  `CREATE TABLE IF NOT EXISTS enderecos (
    id SERIAL PRIMARY KEY,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_enderecos_tenant ON enderecos ("tenantId")`,
  `DROP TRIGGER IF EXISTS enderecos_updated_at ON enderecos`,
  `CREATE TRIGGER enderecos_updated_at
     BEFORE UPDATE ON enderecos
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de alunos
  `CREATE TABLE IF NOT EXISTS alunos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    "dataNascimento" DATE NOT NULL,
    serie VARCHAR(50) NOT NULL,
    turma VARCHAR(10) NOT NULL,
    periodo VARCHAR(1) NOT NULL CHECK (periodo IN ('M', 'T', 'N')),
    status VARCHAR(10) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    "escolaId" INTEGER NOT NULL REFERENCES escolas(id) ON DELETE RESTRICT,
    "responsavelId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "motoristaId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "enderecoContratanteId" INTEGER NOT NULL REFERENCES enderecos(id) ON DELETE RESTRICT,
    "enderecoSaidaId" INTEGER REFERENCES enderecos(id) ON DELETE SET NULL,
    "valorMensal" DECIMAL(10, 2) NOT NULL,
    "formaPagamento" VARCHAR(10) NOT NULL CHECK ("formaPagamento" IN ('debito', 'credito', 'pix', 'boleto')),
    "diasSemana" JSONB NOT NULL,
    "datasVencimento" JSONB NOT NULL,
    "contratoId" INTEGER,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_alunos_responsavel ON alunos ("responsavelId")`,
  `CREATE INDEX IF NOT EXISTS idx_alunos_motorista ON alunos ("motoristaId")`,
  `CREATE INDEX IF NOT EXISTS idx_alunos_tenant ON alunos ("tenantId")`,
  `CREATE INDEX IF NOT EXISTS idx_alunos_escola ON alunos ("escolaId")`,
  `DROP TRIGGER IF EXISTS alunos_updated_at ON alunos`,
  `CREATE TRIGGER alunos_updated_at
     BEFORE UPDATE ON alunos
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de veículos
  `CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE,
    modelo VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    "quilometragemAtual" INTEGER DEFAULT 0,
    "motoristaId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_veiculos_motorista ON veiculos ("motoristaId")`,
  `CREATE INDEX IF NOT EXISTS idx_veiculos_tenant ON veiculos ("tenantId")`,
  `DROP TRIGGER IF EXISTS veiculos_updated_at ON veiculos`,
  `CREATE TRIGGER veiculos_updated_at
     BEFORE UPDATE ON veiculos
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de documentos do veículo
  `CREATE TABLE IF NOT EXISTS documento_veiculos (
    id SERIAL PRIMARY KEY,
    "veiculoId" INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('licenciamento', 'seguro', 'vistoria_escolar')),
    numero VARCHAR(100) NOT NULL,
    validade DATE NOT NULL,
    "arquivoUrl" VARCHAR(500),
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_docvehicle_veiculo ON documento_veiculos ("veiculoId")`,
  `CREATE INDEX IF NOT EXISTS idx_docvehicle_tenant ON documento_veiculos ("tenantId")`,
  `DROP TRIGGER IF EXISTS documento_veiculos_updated_at ON documento_veiculos`,
  `CREATE TRIGGER documento_veiculos_updated_at
     BEFORE UPDATE ON documento_veiculos
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de manutenções
  `CREATE TABLE IF NOT EXISTS manutencoes (
    id SERIAL PRIMARY KEY,
    "veiculoId" INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
    "dataAgendada" TIMESTAMP,
    "dataRealizada" TIMESTAMP,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('preventiva', 'corretiva')),
    descricao TEXT NOT NULL,
    custo DECIMAL(10, 2) DEFAULT 0,
    quilometragem INTEGER NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('agendada', 'realizada', 'atrasada')),
    "repetirTipo" VARCHAR(6) CHECK ("repetirTipo" IN ('km', 'meses')),
    "repetirIntervalo" INTEGER,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON manutencoes ("veiculoId")`,
  `CREATE INDEX IF NOT EXISTS idx_manutencoes_status ON manutencoes (status)`,
  `CREATE INDEX IF NOT EXISTS idx_manutencoes_tenant ON manutencoes ("tenantId")`,
  `DROP TRIGGER IF EXISTS manutencoes_updated_at ON manutencoes`,
  `CREATE TRIGGER manutencoes_updated_at
     BEFORE UPDATE ON manutencoes
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de contratos
  `CREATE TABLE IF NOT EXISTS contratos (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    "responsavelId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    periodo VARCHAR(1) NOT NULL CHECK (periodo IN ('M', 'T', 'N')),
    valor DECIMAL(10, 2) NOT NULL,
    vencimento INTEGER NOT NULL,
    "statusAssinatura" VARCHAR(10) DEFAULT 'pendente' CHECK ("statusAssinatura" IN ('pendente', 'assinado', 'cancelado')),
    "statusPagamento" VARCHAR(10) DEFAULT 'em_dia' CHECK ("statusPagamento" IN ('em_dia', 'atrasado')),
    "periodoAtraso" INTEGER DEFAULT 0,
    clausulas TEXT,
    "arquivoUrl" VARCHAR(500),
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE,
    "dataEnvio" TIMESTAMP,
    "dataAssinatura" TIMESTAMP,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_contratos_responsavel ON contratos ("responsavelId")`,
  `CREATE INDEX IF NOT EXISTS idx_contratos_tenant ON contratos ("tenantId")`,
  `DROP TRIGGER IF EXISTS contratos_updated_at ON contratos`,
  `CREATE TRIGGER contratos_updated_at
     BEFORE UPDATE ON contratos
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de relação contrato-aluno
  `CREATE TABLE IF NOT EXISTS contrato_alunos (
    id SERIAL PRIMARY KEY,
    "contratoId" INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    "alunoId" INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE ("contratoId", "alunoId")
  )`,
  `CREATE INDEX IF NOT EXISTS idx_contrato_alunos_contrato ON contrato_alunos ("contratoId")`,
  `CREATE INDEX IF NOT EXISTS idx_contrato_alunos_aluno ON contrato_alunos ("alunoId")`,

  // Tabela de logs de contrato
  `CREATE TABLE IF NOT EXISTS contrato_logs (
    id SERIAL PRIMARY KEY,
    "contratoId" INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    acao VARCHAR(10) NOT NULL CHECK (acao IN ('criado', 'enviado', 'assinado', 'cancelado', 'reemitido')),
    data TIMESTAMP NOT NULL,
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_contrato_logs_contrato ON contrato_logs ("contratoId")`,

  // Tabela de lançamentos financeiros
  `CREATE TABLE IF NOT EXISTS lancamentos (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('receita_recorrente', 'receita_extra', 'despesa_fixa', 'despesa_variavel')),
    valor DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL,
    "dataVencimento" DATE,
    "dataPagamento" DATE,
    descricao TEXT NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('pago', 'pendente', 'atrasado')),
    "vinculadoAlunoId" INTEGER REFERENCES alunos(id) ON DELETE SET NULL,
    "vinculadoContratoId" INTEGER REFERENCES contratos(id) ON DELETE SET NULL,
    "recorrenciaTipo" VARCHAR(12) CHECK ("recorrenciaTipo" IN ('mensal', 'trimestral', 'semestral', 'anual')),
    "recorrenciaMeses" INTEGER,
    "recorrenciaDataFim" DATE,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos (tipo)`,
  `CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos (status)`,
  `CREATE INDEX IF NOT EXISTS idx_lancamentos_tenant ON lancamentos ("tenantId")`,
  `CREATE INDEX IF NOT EXISTS idx_lancamentos_aluno ON lancamentos ("vinculadoAlunoId")`,
  `CREATE INDEX IF NOT EXISTS idx_lancamentos_contrato ON lancamentos ("vinculadoContratoId")`,
  `DROP TRIGGER IF EXISTS lancamentos_updated_at ON lancamentos`,
  `CREATE TRIGGER lancamentos_updated_at
     BEFORE UPDATE ON lancamentos
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de notificações
  `CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('todos', 'especifico')),
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    "enviarAgora" BOOLEAN DEFAULT TRUE,
    "dataHoraAgendamento" TIMESTAMP,
    status VARCHAR(10) DEFAULT 'agendada' CHECK (status IN ('agendada', 'enviada', 'lida', 'cancelada')),
    "templateId" INTEGER,
    "gatilhoTipo" VARCHAR(30) CHECK ("gatilhoTipo" IN ('faturamento', 'rota_inicio', 'rota_fim', 'contrato_pendente', 'manutencao_vencimento')),
    "gatilhoParametros" JSONB,
    "remetenteId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON notificacoes (status)`,
  `CREATE INDEX IF NOT EXISTS idx_notificacoes_remetente ON notificacoes ("remetenteId")`,
  `CREATE INDEX IF NOT EXISTS idx_notificacoes_tenant ON notificacoes ("tenantId")`,
  `DROP TRIGGER IF EXISTS notificacoes_updated_at ON notificacoes`,
  `CREATE TRIGGER notificacoes_updated_at
     BEFORE UPDATE ON notificacoes
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de destinatários de notificação
  `CREATE TABLE IF NOT EXISTS notificacao_destinatarios (
    id SERIAL PRIMARY KEY,
    "notificacaoId" INTEGER NOT NULL REFERENCES notificacoes(id) ON DELETE CASCADE,
    "destinatarioId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lida BOOLEAN DEFAULT FALSE,
    "dataLeitura" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE ("notificacaoId", "destinatarioId")
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notif_dest_notif ON notificacao_destinatarios ("notificacaoId")`,
  `CREATE INDEX IF NOT EXISTS idx_notif_dest_dest ON notificacao_destinatarios ("destinatarioId")`,

  // Tabela de rotas
  `CREATE TABLE IF NOT EXISTS rotas (
    id SERIAL PRIMARY KEY,
    periodo VARCHAR(1) NOT NULL CHECK (periodo IN ('M', 'T', 'N')),
    data DATE NOT NULL,
    status VARCHAR(15) DEFAULT 'nao_iniciada' CHECK (status IN ('nao_iniciada', 'em_andamento', 'finalizada')),
    "motoristaId" INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    "veiculoId" INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
    "horaInicio" TIMESTAMP,
    "horaFim" TIMESTAMP,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rotas_motorista ON rotas ("motoristaId")`,
  `CREATE INDEX IF NOT EXISTS idx_rotas_veiculo ON rotas ("veiculoId")`,
  `CREATE INDEX IF NOT EXISTS idx_rotas_data ON rotas (data)`,
  `CREATE INDEX IF NOT EXISTS idx_rotas_tenant ON rotas ("tenantId")`,
  `DROP TRIGGER IF EXISTS rotas_updated_at ON rotas`,
  `CREATE TRIGGER rotas_updated_at
     BEFORE UPDATE ON rotas
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de pontos de rota
  `CREATE TABLE IF NOT EXISTS ponto_rotas (
    id SERIAL PRIMARY KEY,
    "rotaId" INTEGER NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    "alunoId" INTEGER REFERENCES alunos(id) ON DELETE SET NULL,
    tipo VARCHAR(8) NOT NULL CHECK (tipo IN ('casa', 'escola', 'retorno')),
    "enderecoId" INTEGER NOT NULL REFERENCES enderecos(id) ON DELETE RESTRICT,
    ordem INTEGER NOT NULL,
    "tempoEstimado" INTEGER,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ponto_rotas_rota ON ponto_rotas ("rotaId")`,
  `CREATE INDEX IF NOT EXISTS idx_ponto_rotas_aluno ON ponto_rotas ("alunoId")`,
  `CREATE INDEX IF NOT EXISTS idx_ponto_rotas_endereco ON ponto_rotas ("enderecoId")`,

  // Tabela de paradas de rota
  `CREATE TABLE IF NOT EXISTS parada_rotas (
    id SERIAL PRIMARY KEY,
    "rotaId" INTEGER NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    "pontoId" INTEGER NOT NULL REFERENCES ponto_rotas(id) ON DELETE CASCADE,
    "horaChegada" TIMESTAMP,
    "horaSaida" TIMESTAMP,
    "notificacaoEnviada" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_parada_rotas_rota ON parada_rotas ("rotaId")`,
  `CREATE INDEX IF NOT EXISTS idx_parada_rotas_ponto ON parada_rotas ("pontoId")`,

  // Tabela de localização de veículos
  `CREATE TABLE IF NOT EXISTS localizacao_veiculos (
    id SERIAL PRIMARY KEY,
    "veiculoId" INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    velocidade DECIMAL(5, 2),
    direcao DECIMAL(5, 2),
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_localizacao_veiculo ON localizacao_veiculos ("veiculoId")`,
  `CREATE INDEX IF NOT EXISTS idx_localizacao_timestamp ON localizacao_veiculos (timestamp)`,
  `CREATE INDEX IF NOT EXISTS idx_localizacao_tenant ON localizacao_veiculos ("tenantId")`,
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Iniciando migrations...');

    // Criar função de trigger antes de tudo
    await client.query(triggerFunction);
    console.log('✅ Função de trigger update_updated_at_column criada/atualizada');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      try {
        await client.query(migration);
        console.log(`✅ Migration ${i + 1}/${migrations.length} executada`);
      } catch (err: any) {
        // Ignorar erros de coluna/índice já existente (idempotente)
        if (
          err.code === '42701' || // duplicate_column
          err.code === '42P07' || // duplicate_table (não deve acontecer com IF NOT EXISTS)
          err.code === '42710'    // duplicate_object (trigger já existe)
        ) {
          console.log(`⚠️  Migration ${i + 1}/${migrations.length} ignorada: já aplicada (${err.code})`);
        } else {
          console.error(`❌ Erro na migration ${i + 1}:`, err.message);
          throw err;
        }
      }
    }

    console.log('\n✅ Todas as migrations foram executadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigrations();
