import pool from '../config/database';
import { hashPassword } from '../utils/password';

async function seed() {
  try {
    console.log('🌱 Iniciando seed...');

    // Criar admin padrão
    const adminPassword = await hashPassword('admin123');
    await pool.execute(
      `INSERT INTO users (nome, email, password, role, tenantId)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nome = nome`,
      ['Administrador', 'admin@maechegou.com', adminPassword, 'admin', 1]
    );

    // Criar motorista de exemplo
    const motoristaPassword = await hashPassword('motorista123');
    const [motoristaResult] = await pool.execute(
      `INSERT INTO users (nome, email, password, role, telefone, tenantId)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nome = nome`,
      ['João Silva', 'motorista@maechegou.com', motoristaPassword, 'motorista', '(11) 98765-4321', 1]
    ) as any;

    // Obter o ID do motorista (se já existir, buscar pelo email)
    let motoristaId = motoristaResult.insertId;
    if (!motoristaId) {
      const [existingMotorista] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        ['motorista@maechegou.com']
      ) as any;
      motoristaId = existingMotorista[0]?.id || 2;
    }

    // Criar responsável de exemplo
    const responsavelPassword = await hashPassword('responsavel123');
    const [responsavelResult] = await pool.execute(
      `INSERT INTO users (nome, email, password, role, telefone, cpf, motoristaId, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nome = nome`,
      ['Maria Santos', 'responsavel@maechegou.com', responsavelPassword, 'responsavel', '(11) 91234-5678', '123.456.789-00', motoristaId, 1]
    ) as any;

    const responsavelId = responsavelResult.insertId || 3;

    // Criar veículo de exemplo
    const [veiculoResult] = await pool.execute(
      `INSERT INTO veiculos (placa, modelo, ano, quilometragemAtual, motoristaId, tenantId)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE placa = placa`,
      ['ABC-1234', 'Van Escolar', 2020, 45000, motoristaId, 1]
    ) as any;

    const veiculoId = veiculoResult.insertId || 1;

    // Criar documentos do veículo
    await pool.execute(
      `INSERT INTO documento_veiculos (veiculoId, tipo, numero, validade, tenantId)
       VALUES (?, 'licenciamento', 'LIC-2024-001', '2024-12-31', ?),
              (?, 'seguro', 'SEG-2024-001', '2024-06-30', ?),
              (?, 'vistoria_escolar', 'VIS-2024-001', '2024-03-31', ?)
       ON DUPLICATE KEY UPDATE numero = numero`,
      [veiculoId, 1, veiculoId, 1, veiculoId, 1]
    );

    // Criar escola de exemplo
    const [escolaResult] = await pool.execute(
      `INSERT INTO escolas (nome, endereco, cidade, estado, cep, tenantId)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nome = nome`,
      ['Escola Municipal São Paulo', 'Rua A, 123', 'São Paulo', 'SP', '01000-000', 1]
    ) as any;

    const escolaId = escolaResult.insertId || 1;

    // Criar endereço de exemplo
    const [enderecoResult] = await pool.execute(
      `INSERT INTO enderecos (rua, numero, bairro, cidade, estado, cep, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rua = rua`,
      ['Rua B', '456', 'Centro', 'São Paulo', 'SP', '01000-000', 1]
    ) as any;

    const enderecoId = enderecoResult.insertId || 1;

    // Criar aluno de exemplo
    await pool.execute(
      `INSERT INTO alunos (
        nome, dataNascimento, serie, turma, periodo, status,
        escolaId, responsavelId, motoristaId, enderecoContratanteId,
        valorMensal, formaPagamento, diasSemana, datasVencimento, tenantId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE nome = nome`,
      [
        'João Silva',
        '2010-05-15',
        '5º Ano',
        'A',
        'M',
        'ativo',
        escolaId,
        responsavelId,
        motoristaId,
        enderecoId,
        250.00,
        'pix',
        JSON.stringify(['segunda', 'terca', 'quarta', 'quinta', 'sexta']),
        JSON.stringify([5]),
        1,
      ]
    );

    console.log('✅ Seed executado com sucesso!');
    console.log('\n📝 Credenciais de teste:');
    console.log('Admin: admin@maechegou.com / admin123');
    console.log('Motorista: motorista@maechegou.com / motorista123');
    console.log('Responsável: responsavel@maechegou.com / responsavel123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
}

seed();

