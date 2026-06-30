import pool from '../config/database';

const migrations = [
  // Tabela de usuários
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'motorista', 'responsavel', 'aluno') NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14),
    motoristaId INT,
    tenantId INT,
    statusOnline BOOLEAN NOT NULL DEFAULT FALSE,
    lastHeartbeat DATETIME NULL DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_tenant (tenantId),
    INDEX idx_motorista (motoristaId),
    INDEX idx_users_motorista_online (statusOnline, role),
    FOREIGN KEY (motoristaId) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de escolas
  `CREATE TABLE IF NOT EXISTS escolas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco VARCHAR(500) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenantId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de endereços
  `CREATE TABLE IF NOT EXISTS enderecos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant (tenantId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de alunos
  `CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    dataNascimento DATE NOT NULL,
    serie VARCHAR(50) NOT NULL,
    turma VARCHAR(10) NOT NULL,
    periodo ENUM('M', 'T', 'N') NOT NULL,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    escolaId INT NOT NULL,
    responsavelId INT NOT NULL,
    motoristaId INT NOT NULL,
    enderecoContratanteId INT NOT NULL,
    enderecoSaidaId INT,
    valorMensal DECIMAL(10, 2) NOT NULL,
    formaPagamento ENUM('debito', 'credito', 'pix', 'boleto') NOT NULL,
    diasSemana JSON NOT NULL,
    datasVencimento JSON NOT NULL,
    contratoId INT,
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_responsavel (responsavelId),
    INDEX idx_motorista (motoristaId),
    INDEX idx_tenant (tenantId),
    INDEX idx_escola (escolaId),
    FOREIGN KEY (escolaId) REFERENCES escolas(id) ON DELETE RESTRICT,
    FOREIGN KEY (responsavelId) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (motoristaId) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (enderecoContratanteId) REFERENCES enderecos(id) ON DELETE RESTRICT,
    FOREIGN KEY (enderecoSaidaId) REFERENCES enderecos(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de veículos
  `CREATE TABLE IF NOT EXISTS veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE,
    modelo VARCHAR(100) NOT NULL,
    ano INT NOT NULL,
    quilometragemAtual INT DEFAULT 0,
    motoristaId INT NOT NULL,
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_motorista (motoristaId),
    INDEX idx_tenant (tenantId),
    FOREIGN KEY (motoristaId) REFERENCES users(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de documentos do veículo
  `CREATE TABLE IF NOT EXISTS documento_veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculoId INT NOT NULL,
    tipo ENUM('licenciamento', 'seguro', 'vistoria_escolar') NOT NULL,
    numero VARCHAR(100) NOT NULL,
    validade DATE NOT NULL,
    arquivoUrl VARCHAR(500),
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_veiculo (veiculoId),
    INDEX idx_tenant (tenantId),
    FOREIGN KEY (veiculoId) REFERENCES veiculos(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de manutenções
  `CREATE TABLE IF NOT EXISTS manutencoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculoId INT NOT NULL,
    dataAgendada DATETIME,
    dataRealizada DATETIME,
    tipo ENUM('preventiva', 'corretiva') NOT NULL,
    descricao TEXT NOT NULL,
    custo DECIMAL(10, 2) DEFAULT 0,
    quilometragem INT NOT NULL,
    status ENUM('agendada', 'realizada', 'atrasada') NOT NULL,
    repetirTipo ENUM('km', 'meses'),
    repetirIntervalo INT,
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_veiculo (veiculoId),
    INDEX idx_status (status),
    INDEX idx_tenant (tenantId),
    FOREIGN KEY (veiculoId) REFERENCES veiculos(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de contratos
  `CREATE TABLE IF NOT EXISTS contratos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    responsavelId INT NOT NULL,
    periodo ENUM('M', 'T', 'N') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    vencimento INT NOT NULL,
    statusAssinatura ENUM('pendente', 'assinado', 'cancelado') DEFAULT 'pendente',
    statusPagamento ENUM('em_dia', 'atrasado') DEFAULT 'em_dia',
    periodoAtraso INT DEFAULT 0,
    clausulas TEXT,
    arquivoUrl VARCHAR(500),
    dataInicio DATE NOT NULL,
    dataFim DATE,
    dataEnvio DATETIME,
    dataAssinatura DATETIME,
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_responsavel (responsavelId),
    INDEX idx_tenant (tenantId),
    FOREIGN KEY (responsavelId) REFERENCES users(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de relação contrato-aluno
  `CREATE TABLE IF NOT EXISTS contrato_alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contratoId INT NOT NULL,
    alunoId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contrato (contratoId),
    INDEX idx_aluno (alunoId),
    FOREIGN KEY (contratoId) REFERENCES contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (alunoId) REFERENCES alunos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_contrato_aluno (contratoId, alunoId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de logs de contrato
  `CREATE TABLE IF NOT EXISTS contrato_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contratoId INT NOT NULL,
    acao ENUM('criado', 'enviado', 'assinado', 'cancelado', 'reemitido') NOT NULL,
    data DATETIME NOT NULL,
    observacoes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contrato (contratoId),
    FOREIGN KEY (contratoId) REFERENCES contratos(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de lançamentos financeiros
  `CREATE TABLE IF NOT EXISTS lancamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('receita', 'despesa') NOT NULL,
    categoria ENUM('receita_recorrente', 'receita_extra', 'despesa_fixa', 'despesa_variavel') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL,
    dataVencimento DATE,
    dataPagamento DATE,
    descricao TEXT NOT NULL,
    status ENUM('pago', 'pendente', 'atrasado') NOT NULL,
    vinculadoAlunoId INT,
    vinculadoContratoId INT,
    recorrenciaTipo ENUM('mensal', 'trimestral', 'semestral', 'anual'),
    recorrenciaMeses INT,
    recorrenciaDataFim DATE,
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_status (status),
    INDEX idx_tenant (tenantId),
    INDEX idx_aluno (vinculadoAlunoId),
    INDEX idx_contrato (vinculadoContratoId),
    FOREIGN KEY (vinculadoAlunoId) REFERENCES alunos(id) ON DELETE SET NULL,
    FOREIGN KEY (vinculadoContratoId) REFERENCES contratos(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de notificações
  `CREATE TABLE IF NOT EXISTS notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('todos', 'especifico') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    enviarAgora BOOLEAN DEFAULT true,
    dataHoraAgendamento DATETIME,
    status ENUM('agendada', 'enviada', 'lida', 'cancelada') DEFAULT 'agendada',
    templateId INT,
    gatilhoTipo ENUM('faturamento', 'rota_inicio', 'rota_fim', 'contrato_pendente', 'manutencao_vencimento'),
    gatilhoParametros JSON,
    remetenteId INT NOT NULL,
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_remetente (remetenteId),
    INDEX idx_tenant (tenantId),
    FOREIGN KEY (remetenteId) REFERENCES users(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de destinatários de notificação
  `CREATE TABLE IF NOT EXISTS notificacao_destinatarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notificacaoId INT NOT NULL,
    destinatarioId INT NOT NULL,
    lida BOOLEAN DEFAULT false,
    dataLeitura DATETIME,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notificacao (notificacaoId),
    INDEX idx_destinatario (destinatarioId),
    FOREIGN KEY (notificacaoId) REFERENCES notificacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (destinatarioId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_notificacao_destinatario (notificacaoId, destinatarioId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de rotas
  `CREATE TABLE IF NOT EXISTS rotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    periodo ENUM('M', 'T', 'N') NOT NULL,
    data DATE NOT NULL,
    status ENUM('nao_iniciada', 'em_andamento', 'finalizada') DEFAULT 'nao_iniciada',
    motoristaId INT NOT NULL,
    veiculoId INT NOT NULL,
    horaInicio DATETIME,
    horaFim DATETIME,
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_motorista (motoristaId),
    INDEX idx_veiculo (veiculoId),
    INDEX idx_data (data),
    INDEX idx_tenant (tenantId),
    FOREIGN KEY (motoristaId) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (veiculoId) REFERENCES veiculos(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de pontos de rota
  `CREATE TABLE IF NOT EXISTS ponto_rotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rotaId INT NOT NULL,
    alunoId INT,
    tipo ENUM('casa', 'escola', 'retorno') NOT NULL,
    enderecoId INT NOT NULL,
    ordem INT NOT NULL,
    tempoEstimado INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rota (rotaId),
    INDEX idx_aluno (alunoId),
    INDEX idx_endereco (enderecoId),
    FOREIGN KEY (rotaId) REFERENCES rotas(id) ON DELETE CASCADE,
    FOREIGN KEY (alunoId) REFERENCES alunos(id) ON DELETE SET NULL,
    FOREIGN KEY (enderecoId) REFERENCES enderecos(id) ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de paradas de rota
  `CREATE TABLE IF NOT EXISTS parada_rotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rotaId INT NOT NULL,
    pontoId INT NOT NULL,
    horaChegada DATETIME,
    horaSaida DATETIME,
    notificacaoEnviada BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rota (rotaId),
    INDEX idx_ponto (pontoId),
    FOREIGN KEY (rotaId) REFERENCES rotas(id) ON DELETE CASCADE,
    FOREIGN KEY (pontoId) REFERENCES ponto_rotas(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Tabela de localização de veículos
  `CREATE TABLE IF NOT EXISTS localizacao_veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculoId INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp DATETIME NOT NULL,
    velocidade DECIMAL(5, 2),
    direcao DECIMAL(5, 2),
    tenantId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_veiculo (veiculoId),
    INDEX idx_timestamp (timestamp),
    INDEX idx_tenant (tenantId),
    FOREIGN KEY (veiculoId) REFERENCES veiculos(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // Alteração para adicionar statusOnline e lastHeartbeat em users (para DBs existentes)
  `ALTER TABLE users
    ADD COLUMN statusOnline BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN lastHeartbeat DATETIME NULL DEFAULT NULL;`,
  `CREATE INDEX idx_users_motorista_online ON users (statusOnline, role);`
];

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migrations...');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      try {
        await pool.execute(migration);
        console.log(`✅ Migration ${i + 1}/${migrations.length} executada com sucesso`);
      } catch (err: any) {
        // Ignora erros de "coluna duplicada" ou "índice duplicado" causados por ALTER TABLE/CREATE INDEX
        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️ Migration ${i + 1}/${migrations.length} ignorada: já aplicada (${err.code})`);
        } else {
          throw err;
        }
      }
    }

    console.log('✅ Todas as migrations foram executadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    process.exit(1);
  }
}

runMigrations();

