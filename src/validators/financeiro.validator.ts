import { body } from 'express-validator';

export const createLancamentoValidator = [
  body('tipo')
    .isIn(['receita', 'despesa'])
    .withMessage('Tipo de lançamento inválido')
    .notEmpty()
    .withMessage('Tipo é obrigatório'),
  body('categoria')
    .isIn(['receita_recorrente', 'receita_extra', 'despesa_fixa', 'despesa_variavel'])
    .withMessage('Categoria inválida')
    .notEmpty()
    .withMessage('Categoria é obrigatória'),
  body('valor')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser um número positivo maior que zero')
    .notEmpty()
    .withMessage('Valor é obrigatório'),
  body('data')
    .isISO8601()
    .withMessage('Data inválida')
    .notEmpty()
    .withMessage('Data é obrigatória'),
  body('descricao')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Descrição deve ter no mínimo 3 caracteres')
    .notEmpty()
    .withMessage('Descrição é obrigatória'),
  body('dataVencimento')
    .optional()
    .isISO8601()
    .withMessage('Data de vencimento inválida'),
  body('recorrenciaTipo')
    .optional()
    .isIn(['mensal', 'trimestral', 'semestral', 'anual'])
    .withMessage('Tipo de recorrência inválido'),
];

