import { body } from 'express-validator';

export const createNotificacaoValidator = [
  body('tipo')
    .isIn(['todos', 'especifico'])
    .withMessage('Tipo de notificação inválido')
    .notEmpty()
    .withMessage('Tipo é obrigatório'),
  body('titulo')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Título deve ter no mínimo 3 caracteres')
    .notEmpty()
    .withMessage('Título é obrigatório'),
  body('mensagem')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Mensagem deve ter no mínimo 10 caracteres')
    .notEmpty()
    .withMessage('Mensagem é obrigatória'),
  body('enviarAgora')
    .isBoolean()
    .withMessage('enviarAgora deve ser um booleano')
    .notEmpty()
    .withMessage('enviarAgora é obrigatório'),
  body('dataHoraAgendamento')
    .optional()
    .isISO8601()
    .withMessage('Data/hora de agendamento inválida'),
  body('destinatarioIds')
    .optional()
    .isArray()
    .withMessage('destinatarioIds deve ser um array'),
];

