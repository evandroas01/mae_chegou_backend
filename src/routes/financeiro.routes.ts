import { Router } from 'express';
import { FinanceiroController } from '../controllers/FinanceiroController';
import { authenticate, authorize } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { createLancamentoValidator } from '../validators/financeiro.validator';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/resumo', FinanceiroController.getResumo);
router.get('/lancamentos', FinanceiroController.findAll);
router.get('/lancamentos/:id', FinanceiroController.findById);
router.post('/lancamentos', authorize('admin', 'motorista'), validate(createLancamentoValidator), FinanceiroController.create);
router.put('/lancamentos/:id', authorize('admin', 'motorista'), FinanceiroController.update);
router.delete('/lancamentos/:id', authorize('admin', 'motorista'), FinanceiroController.delete);

export default router;

