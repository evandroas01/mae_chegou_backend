import { Router } from 'express';
import { ManutencaoController } from '../controllers/ManutencaoController';
import { authenticate, authorize } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { createManutencaoValidator } from '../validators/manutencao.validator';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.post('/', authorize('admin', 'motorista'), validate(createManutencaoValidator), ManutencaoController.create);
router.get('/', ManutencaoController.findAll);
router.get('/veiculos', authenticate, ManutencaoController.getVeiculos);
router.put('/:id', authorize('admin', 'motorista'), ManutencaoController.update);

export default router;

