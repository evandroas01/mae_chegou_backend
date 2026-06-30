import { Router } from 'express';
import { ContratoController } from '../controllers/ContratoController';
import { authenticate, authorize } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { createContratoValidator } from '../validators/contrato.validator';
import { validate } from '../middleware/validation';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.post('/', authorize('admin', 'motorista'), validate(createContratoValidator), ContratoController.create);
router.get('/', ContratoController.findAll);
router.get('/:id', ContratoController.findById);
router.put('/:id', authorize('admin', 'motorista'), ContratoController.update);
router.delete('/:id', authorize('admin'), ContratoController.delete);
router.post('/:id/assinar', ContratoController.assinar);
router.post('/:id/cancelar', authorize('admin', 'motorista'), ContratoController.cancelar);

export default router;

