import { body } from 'express-validator';

export const createRotaValidator = [
  body('periodo')
    .isIn(['M', 'T', 'N'])
    .withMessage('Período inválido')
    .notEmpty()
    .withMessage('Período é obrigatório'),
  body('data')
    .isISO8601()
    .withMessage('Data inválida')
    .notEmpty()
    .withMessage('Data é obrigatória'),
  body('veiculoId')
    .notEmpty()
    .withMessage('ID do veículo é obrigatório'),
  body('pontos')
    .isArray({ min: 1 })
    .withMessage('Deve ter pelo menos um ponto na rota')
    .notEmpty()
    .withMessage('Pontos são obrigatórios'),
  body('pontos.*.tipo')
    .isIn(['casa', 'escola', 'retorno'])
    .withMessage('Tipo de ponto inválido'),
  body('pontos.*.enderecoId')
    .notEmpty()
    .withMessage('ID do endereço é obrigatório'),
  body('pontos.*.ordem')
    .isInt({ min: 1 })
    .withMessage('Ordem deve ser um número inteiro positivo'),
];

