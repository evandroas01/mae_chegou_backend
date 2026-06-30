import { body } from 'express-validator';

export const createAlunoValidator = [
  body('nome')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Nome deve ter no mínimo 3 caracteres')
    .notEmpty()
    .withMessage('Nome é obrigatório'),
  body('dataNascimento')
    .isISO8601()
    .withMessage('Data de nascimento inválida')
    .notEmpty()
    .withMessage('Data de nascimento é obrigatória'),
  body('serie')
    .trim()
    .notEmpty()
    .withMessage('Série é obrigatória'),
  body('turma')
    .trim()
    .notEmpty()
    .withMessage('Turma é obrigatória'),
  body('periodo')
    .isIn(['M', 'T', 'N'])
    .withMessage('Período inválido')
    .notEmpty()
    .withMessage('Período é obrigatório'),
  body('escola.nome')
    .trim()
    .notEmpty()
    .withMessage('Nome da escola é obrigatório'),
  body('escola.endereco')
    .trim()
    .notEmpty()
    .withMessage('Endereço da escola é obrigatório'),
  body('responsavel.nome')
    .trim()
    .notEmpty()
    .withMessage('Nome do responsável é obrigatório'),
  body('responsavel.cpf')
    .trim()
    .notEmpty()
    .withMessage('CPF do responsável é obrigatório'),
  body('responsavel.telefone')
    .trim()
    .notEmpty()
    .withMessage('Telefone do responsável é obrigatório'),
  body('enderecoContratante.rua')
    .trim()
    .notEmpty()
    .withMessage('Rua do endereço é obrigatória'),
  body('enderecoContratante.numero')
    .trim()
    .notEmpty()
    .withMessage('Número do endereço é obrigatório'),
  body('enderecoContratante.bairro')
    .trim()
    .notEmpty()
    .withMessage('Bairro é obrigatório'),
  body('enderecoContratante.cidade')
    .trim()
    .notEmpty()
    .withMessage('Cidade é obrigatória'),
  body('enderecoContratante.estado')
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter 2 caracteres')
    .notEmpty()
    .withMessage('Estado é obrigatório'),
  body('enderecoContratante.cep')
    .trim()
    .notEmpty()
    .withMessage('CEP é obrigatório'),
  body('valorMensal')
    .isFloat({ min: 0 })
    .withMessage('Valor mensal deve ser um número positivo')
    .notEmpty()
    .withMessage('Valor mensal é obrigatório'),
  body('formaPagamento')
    .isIn(['debito', 'credito', 'pix', 'boleto'])
    .withMessage('Forma de pagamento inválida')
    .notEmpty()
    .withMessage('Forma de pagamento é obrigatória'),
  body('diasSemana')
    .isArray()
    .withMessage('Dias da semana deve ser um array')
    .notEmpty()
    .withMessage('Dias da semana é obrigatório'),
  body('datasVencimento')
    .isArray()
    .withMessage('Datas de vencimento deve ser um array')
    .notEmpty()
    .withMessage('Datas de vencimento é obrigatório'),
];

