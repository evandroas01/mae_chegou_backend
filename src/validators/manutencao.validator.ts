import { body } from 'express-validator';

export const createManutencaoValidator = [
  body('veiculoId')
    .notEmpty()
    .withMessage('ID do veículo é obrigatório'),
  body('tipo')
    .isIn(['preventiva', 'corretiva'])
    .withMessage('Tipo de manutenção inválido')
    .notEmpty()
    .withMessage('Tipo é obrigatório'),
  body('descricao')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Descrição deve ter no mínimo 5 caracteres')
    .notEmpty()
    .withMessage('Descrição é obrigatória'),
  body('quilometragem')
    .isInt({ min: 0 })
    .withMessage('Quilometragem deve ser um número inteiro positivo')
    .notEmpty()
    .withMessage('Quilometragem é obrigatória'),
  body('custo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Custo deve ser um número positivo'),
  body('dataAgendada')
    .optional()
    .isISO8601()
    .withMessage('Data agendada inválida'),
  body('repetirTipo')
    .optional()
    .isIn(['km', 'meses'])
    .withMessage('Tipo de repetição inválido'),
  body('repetirIntervalo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Intervalo de repetição deve ser um número inteiro positivo'),
];

