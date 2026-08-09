import { Router } from 'express';
import { ContratoController } from '../controllers/ContratoController';
import { authenticate, authorize } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/', ContratoController.findAll);
router.get('/:id', ContratoController.findById);
router.post('/', authorize('admin', 'motorista'), ContratoController.create);
router.put('/:id', ContratoController.update);

export default router;
