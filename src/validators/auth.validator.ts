import { body } from 'express-validator';

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .notEmpty()
    .withMessage('Email é obrigatório'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
];

export const registerValidator = [
  body('nome')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Nome deve ter no mínimo 3 caracteres')
    .notEmpty()
    .withMessage('Nome é obrigatório'),
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .notEmpty()
    .withMessage('Email é obrigatório'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  body('role')
    .isIn(['admin', 'motorista', 'responsavel', 'aluno'])
    .withMessage('Role inválido')
    .notEmpty()
    .withMessage('Role é obrigatório'),
];

