import pool from '../config/database';
import { hashPassword } from '../utils/password';

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Iniciando seed...');

    // Criar admin padrão
    const adminPassword = await hashPassword('admin123');
    await client.query(
      `INSERT INTO users (nome, email, password, role, "tenantId")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['Administrador', 'admin@maechegou.com', adminPassword, 'admin', 1]
    );

    // Criar motorista de exemplo
    const motoristaPassword = await hashPassword('motorista123');
    const motoristaResult = await client.query(
      `INSERT INTO users (nome, email, password, role, telefone, "tenantId")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['João Silva', 'motorista@maechegou.com', motoristaPassword, 'motorista', '(11) 98765-4321', 1]
    );

    // Obter o ID do motorista (se já existir, buscar pelo email)
    let motoristaId: number;
    if (motoristaResult.rows.length > 0) {
      motoristaId = motoristaResult.rows[0].id;
    } else {
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1',
        ['motorista@maechegou.com']
      );
      motoristaId = existing.rows[0]?.id || 2;
    }

    // Criar responsável de exemplo
    const responsavelPassword = await hashPassword('responsavel123');
    const responsavelResult = await client.query(
      `INSERT INTO users (nome, email, password, role, telefone, cpf, "motoristaId", "tenantId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Maria Santos', 'responsavel@maechegou.com', responsavelPassword, 'responsavel',
        '(11) 91234-5678', '123.456.789-00', motoristaId, 1]
    );
    const responsavelId: number = responsavelResult.rows[0]?.id || 3;

    // Criar veículo de exemplo
    const veiculoResult = await client.query(
      `INSERT INTO veiculos (placa, modelo, ano, "quilometragemAtual", "motoristaId", "tenantId")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (placa) DO NOTHING
       RETURNING id`,
      ['ABC-1234', 'Van Escolar', 2020, 45000, motoristaId, 1]
    );
    const veiculoId: number = veiculoResult.rows[0]?.id || 1;

    // Criar documentos do veículo
    await client.query(
      `INSERT INTO documento_veiculos ("veiculoId", tipo, numero, validade, "tenantId")
       VALUES
         ($1, 'licenciamento', 'LIC-2024-001', '2024-12-31', $2),
         ($1, 'seguro',        'SEG-2024-001', '2024-06-30', $2),
         ($1, 'vistoria_escolar', 'VIS-2024-001', '2024-03-31', $2)
       ON CONFLICT DO NOTHING`,
      [veiculoId, 1]
    );

    // Criar escola de exemplo
    const escolaResult = await client.query(
      `INSERT INTO escolas (nome, endereco, cidade, estado, cep, "tenantId")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ['Escola Municipal São Paulo', 'Rua A, 123', 'São Paulo', 'SP', '01000-000', 1]
    );
    const escolaId: number = escolaResult.rows[0]?.id || 1;

    // Criar endereço de exemplo
    const enderecoResult = await client.query(
      `INSERT INTO enderecos (rua, numero, bairro, cidade, estado, cep, "tenantId")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['Rua B', '456', 'Centro', 'São Paulo', 'SP', '01000-000', 1]
    );
    const enderecoId: number = enderecoResult.rows[0]?.id || 1;

    // Criar aluno de exemplo
    await client.query(
      `INSERT INTO alunos (
        nome, "dataNascimento", serie, turma, periodo, status,
        "escolaId", "responsavelId", "motoristaId", "enderecoContratanteId",
        "valorMensal", "formaPagamento", "diasSemana", "datasVencimento", "tenantId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT DO NOTHING`,
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
  } finally {
    client.release();
  }
}

seed();
