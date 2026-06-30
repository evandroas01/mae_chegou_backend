import { body } from 'express-validator';

export const createContratoValidator = [
  body('responsavelId')
    .notEmpty()
    .withMessage('ID do responsável é obrigatório'),
  body('alunoIds')
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos um aluno')
    .notEmpty()
    .withMessage('IDs dos alunos são obrigatórios'),
  body('periodo')
    .isIn(['M', 'T', 'N'])
    .withMessage('Período inválido')
    .notEmpty()
    .withMessage('Período é obrigatório'),
  body('valor')
    .isFloat({ min: 0 })
    .withMessage('Valor deve ser um número positivo')
    .notEmpty()
    .withMessage('Valor é obrigatório'),
  body('vencimento')
    .isInt({ min: 1, max: 31 })
    .withMessage('Vencimento deve ser um dia do mês (1-31)')
    .notEmpty()
    .withMessage('Vencimento é obrigatório'),
  body('dataInicio')
    .isISO8601()
    .withMessage('Data de início inválida')
    .notEmpty()
    .withMessage('Data de início é obrigatória'),
];

