import { Router } from 'express';
import { NotificacaoController } from '../controllers/NotificacaoController';
import { authenticate, authorize } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { createNotificacaoValidator } from '../validators/notificacao.validator';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.post('/', authorize('admin', 'motorista'), validate(createNotificacaoValidator), NotificacaoController.create);
router.get('/', NotificacaoController.findAll);
router.post('/:id/marcar-lida', NotificacaoController.marcarComoLida);
router.get('/responsaveis/disponiveis', authorize('motorista'), NotificacaoController.getResponsaveisDisponiveis);

export default router;

