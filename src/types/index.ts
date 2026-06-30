// User Types
export type UserRole = 'admin' | 'motorista' | 'responsavel' | 'aluno';

export interface User {
  id: string;
  nome: string;
  email: string;
  password: string;
  role: UserRole;
  telefone?: string;
  cpf?: string;
  motoristaId?: string; // Para responsável: ID do motorista
  tenantId?: string; // Para multi-tenancy (ID da empresa/organização)
  statusOnline?: boolean;
  lastHeartbeat?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Aluno Types
export type Periodo = 'M' | 'T' | 'N';
export type StatusAluno = 'ativo' | 'inativo';

export interface Aluno {
  id: string;
  nome: string;
  dataNascimento: Date;
  serie: string;
  turma: string;
  periodo: Periodo;
  status: StatusAluno;
  escolaId: string;
  responsavelId: string;
  motoristaId: string;
  enderecoContratanteId: string;
  enderecoSaidaId?: string;
  valorMensal: number;
  formaPagamento: 'debito' | 'credito' | 'pix' | 'boleto';
  diasSemana: string; // JSON array como string
  datasVencimento: string; // JSON array como string
  contratoId?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Escola Types
export interface Escola {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Endereco Types
export interface Endereco {
  id: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude?: number;
  longitude?: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Veiculo Types
export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  ano: number;
  quilometragemAtual: number;
  motoristaId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Documento Veiculo Types
export type TipoDocumento = 'licenciamento' | 'seguro' | 'vistoria_escolar';

export interface DocumentoVeiculo {
  id: string;
  veiculoId: string;
  tipo: TipoDocumento;
  numero: string;
  validade: Date;
  arquivoUrl?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Manutencao Types
export type ManutencaoTipo = 'preventiva' | 'corretiva';
export type ManutencaoStatus = 'agendada' | 'realizada' | 'atrasada';

export interface Manutencao {
  id: string;
  veiculoId: string;
  dataAgendada?: Date;
  dataRealizada?: Date;
  tipo: ManutencaoTipo;
  descricao: string;
  custo: number;
  quilometragem: number;
  status: ManutencaoStatus;
  repetirTipo?: 'km' | 'meses';
  repetirIntervalo?: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Contrato Types
export interface Contrato {
  id: string;
  numero: string;
  responsavelId: string;
  periodo: Periodo;
  valor: number;
  vencimento: number;
  statusAssinatura: 'pendente' | 'assinado' | 'cancelado';
  statusPagamento: 'em_dia' | 'atrasado';
  periodoAtraso?: number;
  clausulas?: string;
  arquivoUrl?: string;
  dataInicio: Date;
  dataFim?: Date;
  dataEnvio?: Date;
  dataAssinatura?: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Contrato Aluno (Many-to-Many)
export interface ContratoAluno {
  id: string;
  contratoId: string;
  alunoId: string;
  createdAt: Date;
}

// Contrato Log
export interface ContratoLog {
  id: string;
  contratoId: string;
  acao: 'criado' | 'enviado' | 'assinado' | 'cancelado' | 'reemitido';
  data: Date;
  observacoes?: string;
  createdAt: Date;
}

// Lancamento Financeiro Types
export type LancamentoTipo = 'receita' | 'despesa';
export type LancamentoCategoria = 'receita_recorrente' | 'receita_extra' | 'despesa_fixa' | 'despesa_variavel';
export type LancamentoStatus = 'pago' | 'pendente' | 'atrasado';

export interface Lancamento {
  id: string;
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria;
  valor: number;
  data: Date;
  dataVencimento?: Date;
  dataPagamento?: Date;
  descricao: string;
  status: LancamentoStatus;
  vinculadoAlunoId?: string;
  vinculadoContratoId?: string;
  recorrenciaTipo?: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  recorrenciaMeses?: number;
  recorrenciaDataFim?: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notificacao Types
export type NotificacaoTipo = 'todos' | 'especifico';
export type NotificacaoStatus = 'agendada' | 'enviada' | 'lida' | 'cancelada';

export interface Notificacao {
  id: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  enviarAgora: boolean;
  dataHoraAgendamento?: Date;
  status: NotificacaoStatus;
  templateId?: string;
  gatilhoTipo?: 'faturamento' | 'rota_inicio' | 'rota_fim' | 'contrato_pendente' | 'manutencao_vencimento';
  gatilhoParametros?: string; // JSON
  remetenteId: string; // ID do usuário que criou
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notificacao Destinatario (Many-to-Many)
export interface NotificacaoDestinatario {
  id: string;
  notificacaoId: string;
  destinatarioId: string; // User ID
  lida: boolean;
  dataLeitura?: Date;
  createdAt: Date;
}

// Rota Types
export type StatusRota = 'nao_iniciada' | 'em_andamento' | 'finalizada';

export interface Rota {
  id: string;
  periodo: Periodo;
  data: Date;
  status: StatusRota;
  motoristaId: string;
  veiculoId: string;
  horaInicio?: Date;
  horaFim?: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Ponto Rota Types
export type TipoPonto = 'casa' | 'escola' | 'retorno';

export interface PontoRota {
  id: string;
  rotaId: string;
  alunoId?: string;
  tipo: TipoPonto;
  enderecoId: string;
  ordem: number;
  tempoEstimado?: number;
  createdAt: Date;
}

// Parada Rota Types
export interface ParadaRota {
  id: string;
  rotaId: string;
  pontoId: string;
  horaChegada?: Date;
  horaSaida?: Date;
  notificacaoEnviada: boolean;
  createdAt: Date;
}

// Localizacao Veiculo Types
export interface LocalizacaoVeiculo {
  id: string;
  veiculoId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  velocidade?: number;
  direcao?: number;
  tenantId: string;
  createdAt: Date;
}

